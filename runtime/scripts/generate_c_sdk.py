#!/usr/bin/env python3
"""Generate the Graaly C canonical catalog from the same contract as TS/Python."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "contract"
SDK = ROOT / "sdk" / "c"
OUT = SDK / "include" / "graaly" / "catalog.h"
MANIFEST = SDK / "catalog-manifest.json"


def macro_piece(value: str) -> str:
    token = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_").upper()
    if not token:
        token = "VALUE"
    if token[0].isdigit():
        token = "_" + token
    return token


def unique_macro(prefix: str, value: str, used: dict[str, str]) -> str:
    base = prefix + macro_piece(value)
    previous = used.get(base)
    if previous is None or previous == value:
        used[base] = value
        return base
    digest = hashlib.sha1(value.encode()).hexdigest()[:8].upper()
    selected = f"{base}_{digest}"
    used[selected] = value
    return selected


def main() -> None:
    api = json.loads((CONTRACT / "latest-api-members.json").read_text())
    constants = json.loads((CONTRACT / "latest-constants.json").read_text())
    polyglot = ROOT / "src/main/resources/polyglot"

    def property_names(path: Path) -> list[str]:
        names: list[str] = []
        for raw in path.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            names.append(line.split("=", 1)[0])
        return names

    def text_values(path: Path) -> list[str]:
        return [
            line.strip()
            for line in path.read_text().splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]

    packet_wrappers = property_names(polyglot / "packetevents-wrappers.properties")
    packet_support_types = property_names(polyglot / "packetevents-types.properties")
    packet_type_paths = text_values(polyglot / "packetevents-packet-types.txt")
    packet_generated_ts = (ROOT / "sdk/typescript/generated-packets.mts").read_text()
    packet_member_names = sorted({
        match.group(1)
        for line in packet_generated_ts.splitlines()
        if (match := re.match(
            r"^\s+(?:readonly\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\??(?:\s*:|\s*\()",
            line,
        ))
    })

    type_properties = {}
    for raw in (ROOT / "src/main/resources/polyglot/api-types.properties").read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        exported, java_type = line.split("=", 1)
        type_properties[exported] = java_type

    member_names: set[str] = set()
    for definition in api["classes"].values():
        for group in ("instance", "writable", "static"):
            member_names.update(definition.get(group, []))

    used: dict[str, str] = {}
    lines = [
        "#ifndef GRAALY_CATALOG_H",
        "#define GRAALY_CATALOG_H",
        "",
        "/*",
        " * GENERATED FILE. Do not edit by hand.",
        " * Source: contract/latest-api-members.json, latest-constants.json,",
        " *         src/main/resources/polyglot/api-types.properties",
        " *",
        " * These are canonical names, not Java class paths. Pass them to the",
        " * universal C bridge (graaly_type, graaly_get, graaly_call, ...).",
        " */",
        "",
        f"#define GRAALY_CATALOG_EXPORTED_TYPE_COUNT {len(type_properties)}u",
        f"#define GRAALY_CATALOG_MEMBER_NAME_COUNT {len(member_names)}u",
        f"#define GRAALY_CATALOG_CONSTANT_COUNT {sum(len(v['constants']) for v in constants['namespaces'].values())}u",
        f"#define GRAALY_CATALOG_PACKET_WRAPPER_COUNT {len(packet_wrappers)}u",
        f"#define GRAALY_CATALOG_PACKET_SUPPORT_TYPE_COUNT {len(packet_support_types)}u",
        f"#define GRAALY_CATALOG_PACKET_TYPE_PATH_COUNT {len(packet_type_paths)}u",
        f"#define GRAALY_CATALOG_PACKET_MEMBER_NAME_COUNT {len(packet_member_names)}u",
        "",
        "/* Canonical exported types. */",
    ]

    type_macros = {}
    for exported in sorted(type_properties):
        macro = unique_macro("GRAALY_TYPE_", exported, used)
        type_macros[exported] = macro
        lines.append(f'#define {macro} "{exported}"')

    lines += ["", "/* Canonical member/property/method names. */"]
    member_macros = {}
    for member in sorted(member_names):
        macro = unique_macro("GRAALY_MEMBER_", member, used)
        member_macros[member] = macro
        lines.append(f'#define {macro} "{member}"')

    lines += ["", "/* Stable constant namespaces and constants. */"]
    constant_count = 0
    namespace_counts = {}
    for namespace, definition in constants["namespaces"].items():
        prefix = "GRAALY_" + macro_piece(namespace) + "_"
        namespace_macro = "GRAALY_NAMESPACE_" + macro_piece(namespace)
        lines.append("")
        lines.append(f'#define {namespace_macro} "{namespace}"')
        namespace_counts[namespace] = len(definition["constants"])
        for name in definition["constants"]:
            macro = unique_macro(prefix, name, used)
            lines.append(f'#define {macro} "{name}"')
            constant_count += 1

    lines += ["", "/* PacketEvents 2.13.0 wrapper symbols. */"]
    for name in sorted(packet_wrappers):
        macro = unique_macro("GRAALY_PACKET_WRAPPER_", name, used)
        lines.append(f'#define {macro} "{name}"')

    lines += ["", "/* PacketEvents/Adventure supporting type symbols. */"]
    for name in sorted(packet_support_types):
        macro = unique_macro("GRAALY_PACKET_SUPPORT_", name, used)
        lines.append(f'#define {macro} "{name}"')

    lines += ["", "/* PacketEvents packet type paths. */"]
    for path in sorted(packet_type_paths):
        macro = unique_macro("GRAALY_PACKET_", path, used)
        lines.append(f'#define {macro} "{path}"')

    lines += ["", "/* PacketEvents wrapper/support member and static names. */"]
    for name in packet_member_names:
        macro = unique_macro("GRAALY_PACKET_MEMBER_", name, used)
        lines.append(f'#define {macro} "{name}"')

    lines += ["", "#endif", ""]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines))

    manifest = {
        "contractVersion": api["contractVersion"],
        "canonicalApiVersion": api["canonicalApiVersion"],
        "exportedTypes": len(type_properties),
        "canonicalClasses": len(api["classes"]),
        "uniqueMemberNames": len(member_names),
        "memberReferences": sum(
            len(definition.get(group, []))
            for definition in api["classes"].values()
            for group in ("instance", "writable", "static")
        ),
        "constantNamespaces": len(constants["namespaces"]),
        "constants": constant_count,
        "namespaceCounts": namespace_counts,
        "packetWrappers": len(packet_wrappers),
        "packetSupportTypes": len(packet_support_types),
        "packetTypePaths": len(packet_type_paths),
        "packetMemberNames": len(packet_member_names),
        "generatedHeader": str(OUT.relative_to(ROOT)),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    print(
        f"Generated C catalog: {manifest['exportedTypes']} types, "
        f"{manifest['uniqueMemberNames']} member names, {manifest['constants']} constants, "
        f"{manifest['packetWrappers']} packet wrappers, "
        f"{manifest['packetMemberNames']} packet member names"
    )


if __name__ == "__main__":
    main()
