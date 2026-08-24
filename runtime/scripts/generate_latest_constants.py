#!/usr/bin/env python3
"""Snapshot Graaly's canonical constant namespaces from a selected API JAR."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
TYPES = {
    "Material": ("org.bukkit.Material", "Material", "Materials"),
    "Sound": ("org.bukkit.Sound", "Sound", "Sounds"),
    "Particle": ("org.bukkit.Particle", "ApiObject", "Particles"),
    "DyeColor": ("org.bukkit.DyeColor", "DyeColor", "DyeColors"),
    "EntityType": ("org.bukkit.entity.EntityType", "EntityType", "EntityTypes"),
    "Attribute": ("org.bukkit.attribute.Attribute", "Attribute", "Attributes"),
    "GameMode": ("org.bukkit.GameMode", "GameMode", "GameModes"),
    "Difficulty": ("org.bukkit.Difficulty", "Difficulty", "Difficulties"),
    "WorldEnvironment": ("org.bukkit.World$Environment", "WorldEnvironment", "WorldEnvironments"),
    "WorldType": ("org.bukkit.WorldType", "WorldType", "WorldTypes"),
    "Biome": ("org.bukkit.block.Biome", "Biome", "Biomes"),
    "PotionEffect": ("org.bukkit.potion.PotionEffectType", "PotionEffectType", "PotionEffects"),
    "Enchantment": ("org.bukkit.enchantments.Enchantment", "Enchantment", "Enchantments"),
}


def constants(api_jar: Path, class_name: str) -> list[str]:
    completed = subprocess.run(
        ["javap", "-public", "-classpath", str(api_jar), class_name],
        check=True,
        text=True,
        capture_output=True,
    )
    names = re.findall(r"(?m)^\s*public static final [^;=]+\s+([A-Z][A-Z0-9_]*);$", completed.stdout)
    return list(dict.fromkeys(names))


def entity_classes(api_jar: Path) -> dict[str, str]:
    """Resolve canonical entity constants to their public Graaly interfaces."""
    source = """
import org.bukkit.entity.EntityType;

public class GraalyEntityCatalog {
    public static void main(String[] args) {
        for (EntityType type : EntityType.values()) {
            Class<?> entityClass = type.getEntityClass();
            System.out.println(type.name() + "="
                    + (entityClass == null ? "Entity" : entityClass.getSimpleName()));
        }
    }
}
""".strip()
    with tempfile.TemporaryDirectory(prefix="graaly-entity-catalog-") as directory:
        source_file = Path(directory) / "GraalyEntityCatalog.java"
        source_file.write_text(source + "\n", encoding="utf-8")
        completed = subprocess.run(
            ["java", "--class-path", str(api_jar), str(source_file)],
            check=True,
            text=True,
            capture_output=True,
        )
    result = dict(
        line.split("=", 1)
        for line in completed.stdout.splitlines()
        if re.fullmatch(r"[A-Z][A-Z0-9_]*=[A-Za-z][A-Za-z0-9_]*", line)
    )
    if not result:
        raise RuntimeError("The canonical EntityType catalog produced no entity mappings")
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("api_jar", type=Path)
    parser.add_argument("--version", default="26.2")
    parser.add_argument("--output", type=Path, default=ROOT / "contract/latest-constants.json")
    args = parser.parse_args()
    if not args.api_jar.is_file():
        parser.error(f"API JAR does not exist: {args.api_jar}")
    namespaces = {}
    for public_name, (runtime_type, sdk_type, plural) in TYPES.items():
        names = constants(args.api_jar, runtime_type)
        definition = {
            "runtimeType": runtime_type,
            "sdkType": sdk_type,
            "plural": plural,
            "constants": names,
        }
        if public_name == "EntityType":
            mapping = entity_classes(args.api_jar)
            if set(mapping) != set(names):
                raise RuntimeError(
                    "EntityType constants and entity mappings differ: "
                    f"missing={sorted(set(names) - set(mapping))}, "
                    f"extra={sorted(set(mapping) - set(names))}"
                )
            definition["entityClasses"] = {name: mapping[name] for name in names}
        namespaces[public_name] = definition

    payload = {
        "contractVersion": "1.0",
        "canonicalApiVersion": args.version,
        "namespaces": namespaces,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    entity_type_names = set(payload["namespaces"]["EntityType"]["entityClasses"].values())
    type_names = sorted(
        {definition["sdkType"] for definition in payload["namespaces"].values()}
        .difference({"ApiObject"})
        | entity_type_names
    )
    ts = [
        "/** Generated canonical Graaly constants. Do not edit by hand. */",
        'import type { ApiObject } from "./base.mts";',
        f'import type {{ {", ".join(type_names)} }} from "./generated-api.mts";',
        "",
        "export interface EntityTypeOf<T extends Entity = Entity> extends EntityType {",
        "    /** Type-only marker used to infer the entity returned by entities.spawn. */",
        "    readonly __graalyEntityType?: T;",
        "}",
        "",
    ]
    py = [
        '"""Generated canonical Graaly constants. Do not edit by hand."""',
        "from typing import Generic, TypeVar",
        "from ._base import ApiObject",
        f'from .api import {", ".join(type_names)}',
        "",
        '_EntityT_co = TypeVar("_EntityT_co", bound=Entity, covariant=True)',
        "",
        "class EntityTypeOf(EntityType, Generic[_EntityT_co]): ...",
        "",
    ]
    constants_fields = []
    for public_name, definition in payload["namespaces"].items():
        plural = definition["plural"]
        sdk_type = definition["sdkType"]
        entity_classes_by_name = definition.get("entityClasses", {})
        ts.append(f"export interface {plural}Namespace {{")
        ts.extend(
            f"    readonly {name}: "
            f"{f'EntityTypeOf<{entity_classes_by_name[name]}>' if entity_classes_by_name else sdk_type};"
            for name in definition["constants"]
        )
        ts.extend(["}", ""])
        py.append(f"class _{plural}:")
        py.extend(
            f"    {name}: "
            f"{f'EntityTypeOf[{entity_classes_by_name[name]}]' if entity_classes_by_name else sdk_type}"
            for name in definition["constants"]
        )
        py.extend(["", f"{plural}: _{plural}", ""])
        constants_fields.append(f"    readonly {public_name}: {plural}Namespace;")
    ts.extend(["export interface ConstantsApi {", *constants_fields, "}", ""])
    (ROOT / "sdk/typescript/constants.mts").write_text("\n".join(ts), encoding="utf-8")
    (ROOT / "sdk/python/graaly/constants.pyi").write_text("\n".join(py), encoding="utf-8")
    print(
        f"Wrote {sum(len(value['constants']) for value in payload['namespaces'].values())} "
        f"canonical constants to {args.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
