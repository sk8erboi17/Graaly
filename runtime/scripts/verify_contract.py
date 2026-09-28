#!/usr/bin/env python3
"""Fail when Graaly's manifest, runtime bootstraps, SDKs, docs, or matrix diverge."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "contract" / "graaly-api.json"
EXPECTED_RELEASES = (
    "1.7.10",
    "1.8.3", "1.8.4", "1.8.5", "1.8.6", "1.8.7", "1.8.8",
    "1.9", "1.9.2", "1.9.4",
    "1.10", "1.10.2",
    "1.11", "1.11.1", "1.11.2",
    "1.12", "1.12.1", "1.12.2",
    "1.13", "1.13.1", "1.13.2",
    "1.14", "1.14.1", "1.14.2", "1.14.3", "1.14.4",
    "1.15", "1.15.1", "1.15.2",
    "1.16.1", "1.16.2", "1.16.3", "1.16.4", "1.16.5",
    "1.17", "1.17.1",
    "1.18", "1.18.1", "1.18.2",
    "1.19", "1.19.1", "1.19.2", "1.19.3", "1.19.4",
    "1.20", "1.20.1", "1.20.2", "1.20.3", "1.20.4", "1.20.5", "1.20.6",
    "1.21", "1.21.1", "1.21.2", "1.21.3", "1.21.4", "1.21.5",
    "1.21.6", "1.21.7", "1.21.8", "1.21.9", "1.21.10", "1.21.11",
    "26.1", "26.1.1", "26.1.2", "26.2",
)

TS_INTERFACES = {
    "events": "EventsApi",
    "commands": "CommandsApi",
    "tasks": "TasksApi",
    "config": "ConfigApi",
    "players": "PlayersApi",
    "worlds": "WorldsApi",
    "entities": "EntitiesApi",
    "http": "HttpApi",
    "websocket": "WebSocketApi",
    "ui": "UiApi",
    "boards": "BoardsApi",
    "packets": "PacketsApi",
    "compatibility": "CompatibilityApi",
    "diagnostics": "DiagnosticsApi",
}

PY_CLASSES = {
    "tasks": "_Tasks",
    "config": "_Config",
    "players": "_Players",
    "worlds": "_Worlds",
    "entities": "_Entities",
    "http": "_Http",
    "websocket": "_WebSocket",
    "ui": "_Ui",
    "boards": "_Boards",
    "packets": "_Packets",
    "compatibility": "_Compatibility",
    "diagnostics": "_Diagnostics",
}


class ContractError(RuntimeError):
    pass


def fail(message: str) -> None:
    raise ContractError(message)


def stable_surface_digest(contract: dict[str, object]) -> str:
    """Fingerprint every generated file that defines editor/runtime parity."""
    files = (
        MANIFEST,
        ROOT / "contract" / contract["constantCatalog"]["file"],
        ROOT / "contract" / contract["apiCatalog"]["memberFile"],
        ROOT / "src/main/resources/polyglot/api-types.properties",
        ROOT / "sdk/typescript/graaly.mts",
        ROOT / "sdk/typescript/constants.mts",
        ROOT / "sdk/typescript/generated-api.mts",
        ROOT / "sdk/python/graaly/_core.pyi",
        ROOT / "sdk/python/graaly/constants.pyi",
        ROOT / "sdk/python/graaly/api/__init__.pyi",
        ROOT / "sdk/c/include/graaly/graaly.h",
        ROOT / "sdk/c/include/graaly/catalog.h",
        ROOT / "sdk/c/src/graaly.c",
        ROOT / "sdk/c/catalog-manifest.json",
        ROOT / "scripts/generate_c_sdk.py",
    )
    digest = hashlib.sha256()
    for path in files:
        digest.update(path.relative_to(ROOT).as_posix().encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def balanced_block(source: str, start_pattern: str, label: str) -> str:
    match = re.search(start_pattern, source)
    if not match:
        fail(f"missing {label}")
    start = source.find("{", match.start())
    if start < 0:
        fail(f"missing opening brace for {label}")
    depth = 0
    quote: str | None = None
    escaped = False
    for index in range(start, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in "'\"`":
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source[start:index + 1]
    fail(f"unterminated {label}")


def python_class(source: str, class_name: str, label: str) -> str:
    match = re.search(rf"(?m)^    class {re.escape(class_name)}(?:\([^\n]*\))?:\s*$", source)
    if not match:
        match = re.search(rf"(?m)^class {re.escape(class_name)}(?:\([^\n]*\))?:\s*$", source)
    if not match:
        fail(f"missing {label}")
    base_indent = len(match.group(0)) - len(match.group(0).lstrip())
    lines = source[match.start():].splitlines()
    selected = [lines[0]]
    for line in lines[1:]:
        if line.strip() and len(line) - len(line.lstrip()) <= base_indent:
            break
        selected.append(line)
    return "\n".join(selected)


def require_tokens(source: str, tokens: list[str], label: str) -> None:
    for token in tokens:
        if not re.search(rf"(?<![A-Za-z0-9_]){re.escape(token)}(?![A-Za-z0-9_])", source):
            fail(f"{label} is missing {token}")


def verify_sources(contract: dict[str, object]) -> None:
    runtime_js = (ROOT / "src/main/resources/polyglot/bootstrap.js").read_text()
    runtime_py = (ROOT / "src/main/resources/polyglot/bootstrap.py").read_text()
    sdk_ts = (ROOT / "sdk/typescript/graaly.mts").read_text()
    sdk_py = (ROOT / "sdk/python/graaly/_core.pyi").read_text()

    modules = contract["modules"]
    assert isinstance(modules, dict)
    for module, definition in modules.items():
        assert isinstance(definition, dict)
        js_members = list(definition["javascript"])
        ts_members = list(definition["typescript"])
        py_members = list(definition["python"])

        js_block = balanced_block(
            runtime_js, rf"\bconst\s+{re.escape(module)}\s*=\s*Object\.freeze\s*\(",
            f"JavaScript runtime module {module}",
        )
        require_tokens(js_block, js_members, f"JavaScript runtime module {module}")
        require_tokens(runtime_js, [module], "JavaScript global exports")

        ts_name = TS_INTERFACES[module]
        ts_block = balanced_block(
            sdk_ts, rf"\bexport\s+interface\s+{re.escape(ts_name)}\b",
            f"TypeScript SDK interface {ts_name}",
        )
        require_tokens(ts_block, ts_members, f"TypeScript SDK interface {ts_name}")
        require_tokens(sdk_ts, [module], "TypeScript runtime exports")

        if module in PY_CLASSES:
            runtime_py_block = python_class(runtime_py, PY_CLASSES[module], f"Python runtime {module}")
            sdk_py_block = python_class(sdk_py, PY_CLASSES[module], f"Python SDK {module}")
        else:
            runtime_py_block = runtime_py
            sdk_py_block = sdk_py
        require_tokens(runtime_py_block, py_members, f"Python runtime module {module}")
        require_tokens(sdk_py_block, py_members, f"Python SDK module {module}")
        if module in PY_CLASSES:
            require_tokens(runtime_py, [f'"{module}"'], "Python module exports")
            require_tokens(sdk_py, [module], "Python SDK exports")
        else:
            require_tokens(runtime_py, [f'"{name}"' for name in py_members], "Python function exports")


def verify_java_adapter(contract: dict[str, object]) -> None:
    source = (ROOT / "src/main/java/io/github/sk8erboi17/graaly/polyglot/GraalyCompatibility.java").read_text()
    contract_version = re.search(r'CONTRACT_VERSION\s*=\s*"([^"]+)"', source)
    minimum = re.search(r'MINIMUM_GAME_VERSION\s*=\s*"([^"]+)"', source)
    if not contract_version or contract_version.group(1) != contract["contractVersion"]:
        fail("Java adapter contract version differs from the manifest")
    expected_minimum = contract["supportedGameVersions"]["minimum"]
    if not minimum or minimum.group(1) != expected_minimum:
        fail("Java adapter minimum game version differs from the manifest")
    actual_capabilities = dict(re.findall(r'versions\.put\("([^"]+)",\s*"([^"]+)"\)', source))
    if actual_capabilities != contract["capabilities"]:
        fail(f"Java capability table differs: {actual_capabilities!r}")
    enum_types = {
        "EntityType": "org.bukkit.entity.EntityType",
        "Attribute": "org.bukkit.attribute.Attribute",
        "MapCursorType": "org.bukkit.map.MapCursor$Type",
        "PotionEffectType": "org.bukkit.potion.PotionEffectType",
    }
    for enum_name, constants in contract["canonicalConstants"].items():
        for constant in constants:
            runtime_type = enum_types.get(enum_name, f"org.bukkit.{enum_name}")
            needle = f'"{runtime_type}", "{constant}"'
            if needle not in source:
                fail(f"Java adapter is missing canonical {enum_name}.{constant}")


def verify_constant_catalog(contract: dict[str, object]) -> None:
    definition = contract["constantCatalog"]
    catalog = json.loads((ROOT / "contract" / definition["file"]).read_text())
    if catalog["contractVersion"] != contract["contractVersion"]:
        fail("constant catalog uses a different Graaly contract version")
    if catalog["canonicalApiVersion"] != definition["canonicalApiVersion"]:
        fail("constant catalog canonical version differs from the manifest")
    if catalog["canonicalApiVersion"] != contract["supportedGameVersions"]["current"]:
        fail("constant catalog is not generated from the current matrix boundary")
    total = 0
    for namespace, values in catalog["namespaces"].items():
        names = values["constants"]
        if len(names) != len(set(names)):
            fail(f"constant namespace {namespace} contains duplicates")
        invalid = [name for name in names if not re.fullmatch(r"[A-Z][A-Z0-9_]*", name)]
        if invalid:
            fail(f"constant namespace {namespace} contains invalid names: {invalid[:3]}")
        total += len(names)
    if total < 4_000:
        fail(f"canonical constant catalog is unexpectedly small ({total})")
    entity_types = catalog["namespaces"]["EntityType"]
    entity_classes = entity_types.get("entityClasses", {})
    if set(entity_classes) != set(entity_types["constants"]):
        fail("canonical entity constants do not all carry a precise return type")
    expected_entities = {"ITEM": "Item", "ZOMBIE": "Zombie", "HORSE": "Horse"}
    if any(entity_classes.get(name) != type_name for name, type_name in expected_entities.items()):
        fail("canonical entity return types differ from the 26.2 API")
    type_script_constants = (ROOT / "sdk/typescript/constants.mts").read_text()
    type_script_facade = (ROOT / "sdk/typescript/graaly.mts").read_text()
    python_constants = (ROOT / "sdk/python/graaly/constants.pyi").read_text()
    python_facade = (ROOT / "sdk/python/graaly/_core.pyi").read_text()
    require_tokens(type_script_constants, ["EntityTypeOf", "Zombie", "Horse"], "typed TypeScript entity constants")
    require_tokens(type_script_facade, ["EntityTypeOf"], "typed TypeScript entity spawn")
    require_tokens(python_constants, ["EntityTypeOf", "Zombie", "Horse"], "typed Python entity constants")
    require_tokens(python_facade, ["EntityTypeOf", "EntityT"], "typed Python entity spawn")
    sources = [
        (ROOT / "src/main/resources/polyglot/bootstrap.js").read_text(),
        (ROOT / "src/main/resources/polyglot/bootstrap.py").read_text(),
        (ROOT / "sdk/typescript/graaly.mts").read_text(),
        (ROOT / "sdk/python/graaly/constants.pyi").read_text(),
    ]
    for exported in definition["directExports"]:
        for source in sources:
            require_tokens(source, [exported], "canonical constant export")


def verify_c_sdk(contract: dict[str, object]) -> None:
    definition = contract.get("cAbi")
    if not isinstance(definition, dict):
        fail("C ABI definition is missing from the contract")
    if definition.get("version") != 1:
        fail("unsupported checked-in C ABI version")
    if definition.get("target") != "wasm32-wasi":
        fail("C ABI target must remain wasm32-wasi")
    if definition.get("developerOwnsDomainStructs") is not True:
        fail("C SDK must keep domain structs in plugin code")
    teaching_memory = definition.get("teachingMemory")
    if not isinstance(teaching_memory, dict):
        fail("C ABI must declare the teaching-memory contract")
    if teaching_memory.get("canary") != "DEADBEEF" or teaching_memory.get("redZoneBytes") != 16:
        fail("C teaching heap canary/red-zone contract changed unexpectedly")
    required_memory_faults = {
        "buffer-underflow", "buffer-overflow", "double-free", "invalid-pointer"
    }
    if set(teaching_memory.get("detects", [])) != required_memory_faults:
        fail("C teaching heap diagnostics differ from the contract")
    if teaching_memory.get("quarantineUntilDisable") is not True:
        fail("C teaching heap must quarantine logical frees until disable")
    if definition.get("fullGeneratedApiParity") is not True:
        fail("C ABI must declare full generated canonical API parity")

    header = (ROOT / "sdk/c/include/graaly/graaly.h").read_text()
    source = (ROOT / "sdk/c/src/graaly.c").read_text()
    catalog_header = (ROOT / "sdk/c/include/graaly/catalog.h").read_text()
    catalog_manifest = json.loads((ROOT / "sdk/c/catalog-manifest.json").read_text())
    example = (ROOT / "examples/EducationalC.cplugin/src/main.c").read_text()
    manifest = ROOT / "examples/EducationalC.cplugin/plugin.yml"
    wasm = ROOT / "examples/EducationalC.cplugin/dist/plugin.wasm"

    require_tokens(header, [
        "GRAALY_C_ABI_VERSION", "graaly_handle_t", "graaly_string_view_t",
        "graaly_events_on", "graaly_commands_on", "graaly_player_read_name",
        "GRAALY_DEADBEEF", "graaly_debug_poison", "graaly_debug_malloc",
        "graaly_debug_check", "graaly_debug_free", "graaly_handle_poison",
    ], "C SDK header")
    require_tokens(source, [
        "import_module", "graaly_abi_version", "graaly_dispatch_event",
        "graaly_dispatch_object_event", "graaly_dispatch_callback",
        "graaly_dispatch_task", "graaly_dispatch_tab_complete",
        "graaly_dispatch_command", "graaly_alloc", "graaly_free",
        "graaly_module_call", "graaly_type", "graaly_constant",
    ], "C SDK implementation")

    api_members = json.loads((ROOT / "contract/latest-api-members.json").read_text())
    constants = json.loads((ROOT / "contract/latest-constants.json").read_text())
    exported_types = sum(
        1 for raw in (ROOT / "src/main/resources/polyglot/api-types.properties").read_text().splitlines()
        if raw.strip() and not raw.lstrip().startswith("#")
    )
    member_names = {
        member
        for class_definition in api_members["classes"].values()
        for group in ("instance", "writable", "static")
        for member in class_definition.get(group, [])
    }
    member_references = sum(
        len(class_definition.get(group, []))
        for class_definition in api_members["classes"].values()
        for group in ("instance", "writable", "static")
    )
    constant_count = sum(len(value["constants"]) for value in constants["namespaces"].values())
    polyglot_resources = ROOT / "src/main/resources/polyglot"

    def generated_property_count(path: Path) -> int:
        return sum(
            1 for raw in path.read_text().splitlines()
            if raw.strip() and not raw.lstrip().startswith("#")
        )

    packet_wrappers = generated_property_count(polyglot_resources / "packetevents-wrappers.properties")
    packet_support_types = generated_property_count(polyglot_resources / "packetevents-types.properties")
    packet_type_paths = sum(
        1 for raw in (polyglot_resources / "packetevents-packet-types.txt").read_text().splitlines()
        if raw.strip() and not raw.lstrip().startswith("#")
    )
    packet_generated_ts = (ROOT / "sdk/typescript/generated-packets.mts").read_text()
    packet_member_names = {
        match.group(1)
        for line in packet_generated_ts.splitlines()
        if (match := re.match(
            r"^\s+(?:readonly\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\??(?:\s*:|\s*\()",
            line,
        ))
    }
    expected_catalog = {
        "types": exported_types,
        "canonicalClasses": len(api_members["classes"]),
        "memberReferences": member_references,
        "uniqueMemberNames": len(member_names),
        "constants": constant_count,
        "constantNamespaces": len(constants["namespaces"]),
        "packetWrappers": packet_wrappers,
        "packetSupportTypes": packet_support_types,
        "packetTypePaths": packet_type_paths,
        "packetMemberNames": len(packet_member_names),
        "generatedHeader": "sdk/c/include/graaly/catalog.h",
    }
    if definition.get("catalog") != expected_catalog:
        fail(f"C ABI catalog summary differs from canonical sources: {definition.get('catalog')!r}")
    manifest_catalog = {
        "types": catalog_manifest.get("exportedTypes"),
        "canonicalClasses": catalog_manifest.get("canonicalClasses"),
        "memberReferences": catalog_manifest.get("memberReferences"),
        "uniqueMemberNames": catalog_manifest.get("uniqueMemberNames"),
        "constants": catalog_manifest.get("constants"),
        "constantNamespaces": catalog_manifest.get("constantNamespaces"),
        "packetWrappers": catalog_manifest.get("packetWrappers"),
        "packetSupportTypes": catalog_manifest.get("packetSupportTypes"),
        "packetTypePaths": catalog_manifest.get("packetTypePaths"),
        "packetMemberNames": catalog_manifest.get("packetMemberNames"),
        "generatedHeader": catalog_manifest.get("generatedHeader"),
    }
    if manifest_catalog != expected_catalog:
        fail(f"generated C catalog manifest differs from canonical sources: {manifest_catalog!r}")
    require_tokens(catalog_header, [
        "GRAALY_CATALOG_EXPORTED_TYPE_COUNT", "GRAALY_TYPE_PLAYER",
        "GRAALY_MEMBER_HEALTH", "GRAALY_MATERIAL_STONE",
        "GRAALY_ENTITYTYPE_ZOMBIE", "GRAALY_SOUND_ENTITY_PLAYER_LEVELUP",
        "GRAALY_PACKET_WRAPPER_WRAPPERPLAYCLIENTCHATMESSAGE",
        "GRAALY_PACKET_PLAY_CLIENT_CHAT_MESSAGE",
        "GRAALY_PACKET_MEMBER_MESSAGE",
    ], "generated C canonical catalog")

    combined_c = header + "\n" + source
    for module_name, module_definition in contract["modules"].items():
        c_members = module_definition.get("c")
        if not isinstance(c_members, list) or not c_members:
            fail(f"C SDK module {module_name} has no declared surface")
        require_tokens(combined_c, list(c_members), f"C SDK module {module_name}")
    require_tokens(example, [
        "typedef struct Player", "Player *out", "out->handle", "sizeof out->name",
        "player_snapshot", "typedef struct MemoryLesson", "GRAALY_DEADBEEF",
        "graaly_debug_malloc", "graaly_debug_free", "coverflow_command",
        "csegfault_command",
    ], "educational C example")
    if re.search(r"(?m)^\\s*typedef\\s+struct\\s+Player\\b", header):
        fail("C SDK must not provide a Player struct; the learner defines it")
    if not manifest.is_file() or not wasm.is_file() or wasm.stat().st_size < 8:
        fail("compiled EducationalC .cplugin example is incomplete")
    if wasm.read_bytes()[:4] != b"\x00asm":
        fail("EducationalC main is not a WebAssembly binary")


def verify_generated_api(contract: dict[str, object]) -> None:
    report = json.loads((ROOT / "sdk/polyglot-parity-report.json").read_text())
    api = report["api"]
    if report["contractVersion"] != contract["contractVersion"]:
        fail("generated API uses a different Graaly contract version")
    if not str(report["canonicalApiVersion"]).startswith(
            str(contract["supportedGameVersions"]["current"])):
        fail("generated API is not based on the current canonical release")
    if api["publicTypes"] < 1_300 or api["exportedNames"] < 1_400:
        fail(f"generated canonical API is unexpectedly small: {api!r}")
    if api["unresolvedTypeScriptTypes"] or api["unresolvedPythonTypes"]:
        fail("generated canonical API contains unresolved SDK types")
    properties = {}
    for raw_line in (ROOT / "src/main/resources/polyglot/api-types.properties").read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        name, class_name = line.split("=", 1)
        properties[name] = class_name
    if len(properties) != api["exportedNames"]:
        fail("runtime type catalog differs from the generated canonical SDK")
    members = json.loads((ROOT / "contract" / contract["apiCatalog"]["memberFile"]).read_text())
    if len(members.get("classes", {})) != api["publicTypes"]:
        fail("canonical member adapter catalog differs from the generated API")
    if "spawnParticle" not in members["classes"]["org.bukkit.World"]["instance"]:
        fail("canonical member adapter catalog is missing a known cross-version member")
    type_script = (ROOT / "sdk/typescript/generated-api.mts").read_text()
    missing = [name for name in properties if f"export const {name} " not in type_script]
    if missing:
        fail(f"TypeScript canonical API is missing exports: {missing[:5]}")


def verify_conformance_manifests() -> None:
    """Keep every human- and machine-facing coverage manifest on one truth."""
    current_path = ROOT / "sdk" / "api-conformance-matrix.json"
    legacy_path = ROOT / "contract" / "legacy-conformance-matrix.json"
    current = json.loads(current_path.read_text())
    legacy = json.loads(legacy_path.read_text())
    report = json.loads((ROOT / "sdk" / "polyglot-parity-report.json").read_text())

    expected = {
        "graalyApiExports": report["api"]["exportedNames"],
        "packetWrappers": report["packetEvents"]["wrapperTypes"],
        "packetSupportingTypes": report["packetEvents"]["supportingTypes"],
        "packetConstants": report["packetEvents"]["packetConstants"],
        "concreteEvents": report["api"]["concreteEvents"],
    }
    for label, manifest in (("SDK", current), ("legacy", legacy)):
        if manifest.get("expectedCatalog") != expected:
            fail(f"{label} conformance catalog differs from generated reality")
        case_ids = [case.get("id") for case in manifest.get("cases", [])]
        if len(case_ids) != len(set(case_ids)):
            fail(f"{label} conformance manifest contains duplicate case ids")
        if "compatibility.canonical-version-adapters" not in case_ids:
            fail(f"{label} conformance manifest omits canonical version adapters")
        command = str(manifest.get("liveVerificationCommand", ""))
        if "scripts/test_matrix.py" not in command:
            fail(f"{label} conformance manifest points at a stale live verifier")

    if current["expectedCatalog"] != legacy["expectedCatalog"]:
        fail("SDK and legacy conformance manifests disagree on catalog totals")
    if {case["id"] for case in current["cases"]} != {case["id"] for case in legacy["cases"]}:
        fail("SDK and legacy conformance manifests cover different cases")
    if current.get("hostRegressionMethods") != legacy.get("hostRegressionMethods"):
        fail("SDK and legacy conformance manifests list different host regressions")
    test_sources = "\n".join(
        path.read_text()
        for path in (ROOT / "src" / "test" / "java").rglob("*.java")
    )
    for method in current.get("hostRegressionMethods", []):
        if not re.search(rf"\b{re.escape(str(method))}\s*\(", test_sources):
            fail(f"conformance manifest references missing host regression {method}")


def verify_docs(contract: dict[str, object], docs: Path) -> None:
    published = docs / "public" / "contracts" / "graaly-api.json"
    if not published.is_file():
        fail(f"documentation contract is missing at {published}")
    if json.loads(published.read_text()) != contract:
        fail("documentation contract differs from the runtime manifest")
    public_constants = json.loads(
        (docs / "public" / "contracts" / "latest-constants.json").read_text())
    runtime_constants = json.loads((ROOT / "contract" / "latest-constants.json").read_text())
    for namespace, runtime_definition in runtime_constants["namespaces"].items():
        published_definition = public_constants["namespaces"].get(namespace)
        if not published_definition or published_definition["constants"] != runtime_definition["constants"]:
            fail(f"documentation constants differ for {namespace}")
        if published_definition.get("entityClasses") != runtime_definition.get("entityClasses"):
            fail(f"documentation entity return types differ for {namespace}")
        if "runtimeType" in published_definition:
            fail(f"documentation leaks an implementation type for {namespace}")
    published_conformance = docs / "public" / "downloads" / "api-conformance-matrix.json"
    if not published_conformance.is_file():
        fail(f"documentation conformance manifest is missing at {published_conformance}")
    runtime_conformance = ROOT / "sdk" / "api-conformance-matrix.json"
    if json.loads(published_conformance.read_text()) != json.loads(runtime_conformance.read_text()):
        fail("documentation conformance manifest differs from the runtime SDK")


def verify_matrix(contract: dict[str, object], matrix_file: Path) -> None:
    if not matrix_file.is_file():
        fail(f"compatibility matrix is missing at {matrix_file}")
    matrix = json.loads(matrix_file.read_text())
    if matrix.get("failed") != 0 or matrix.get("passed") != matrix.get("tested"):
        fail("real-server compatibility matrix is not fully green")
    if matrix.get("tested") != len(EXPECTED_RELEASES) or len(matrix.get("results", [])) != matrix.get("tested"):
        fail("real-server compatibility matrix does not cover every supplied release")
    result_versions = [str(item["version"]) for item in matrix.get("results", [])]
    if len(result_versions) != len(set(result_versions)):
        fail("real-server compatibility matrix contains duplicate releases")
    missing_releases = set(EXPECTED_RELEASES).difference(result_versions)
    unexpected_releases = set(result_versions).difference(EXPECTED_RELEASES)
    if missing_releases or unexpected_releases:
        fail(
            "real-server release set differs from the supplied matrix: "
            f"missing={sorted(missing_releases)}, unexpected={sorted(unexpected_releases)}"
        )
    versions = {str(item["version"]): item for item in matrix.get("results", [])}
    for boundary in (
        contract["supportedGameVersions"]["minimum"],
        contract["supportedGameVersions"]["current"],
    ):
        if boundary not in versions or not versions[boundary].get("passed"):
            fail(f"boundary version {boundary} has no passing real-server result")
    required_markers = {
        "GRAALY_MATRIX_JS_ENTITY", "GRAALY_MATRIX_JS_ATTRIBUTE",
        "GRAALY_MATRIX_JS_UNSUPPORTED",
        "GRAALY_MATRIX_JS_MEMBER",
        "GRAALY_MATRIX_JS_LEGACY_ADAPTERS",
        "GRAALY_MATRIX_PY_ENTITY", "GRAALY_MATRIX_PY_ATTRIBUTE",
        "GRAALY_MATRIX_PY_UNSUPPORTED",
        "GRAALY_MATRIX_PY_MEMBER",
        "GRAALY_MATRIX_PY_LEGACY_ADAPTERS",
    }
    for version, result in versions.items():
        missing = required_markers.difference(result.get("found", []))
        if missing:
            fail(f"matrix {version} predates the current entity contract: {sorted(missing)}")


def verify_packetevents_report(contract: dict[str, object]) -> None:
    path = ROOT / "reports" / "compatibility" / f"packetevents-{contract['supportedGameVersions']['current']}.json"
    if not path.is_file():
        return
    report = json.loads(path.read_text())
    required = {
        "ready for JavaScript", "ready for TypeScript", "ready for Python",
        "PORTING-JS SURFACE PASS", "PORTING-TS SURFACE PASS", "PORTING-PY SURFACE PASS",
    }
    if not report.get("passed") or report.get("fatalSignals") or report.get("missing"):
        fail("PacketEvents real-server report is not fully green")
    if report.get("version") != contract["supportedGameVersions"]["current"]:
        fail("PacketEvents report does not exercise the current server boundary")
    if required.difference(report.get("found", [])):
        fail("PacketEvents report does not cover JS, TS, and Python surfaces")
    if not re.fullmatch(r"packetevents-spigot-2\.13\.0\.jar", str(report.get("packetevents"))):
        fail("PacketEvents report does not use the documented 2.13.0 provider")
    if report.get("packeteventsVersion") != "2.13.0":
        fail("PacketEvents report provider metadata differs from 2.13.0")
    if any(str(report.get(field, "")).startswith("/") for field in ("server", "packetevents")):
        fail("PacketEvents report leaks an absolute workstation path")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docs", type=Path)
    parser.add_argument("--matrix", type=Path)
    args = parser.parse_args()
    contract = json.loads(MANIFEST.read_text())
    verify_sources(contract)
    verify_java_adapter(contract)
    verify_constant_catalog(contract)
    verify_c_sdk(contract)
    verify_generated_api(contract)
    verify_conformance_manifests()
    verify_packetevents_report(contract)
    if args.docs:
        verify_docs(contract, args.docs.resolve())
    if args.matrix:
        verify_matrix(contract, args.matrix.resolve())
    digest = stable_surface_digest(contract)
    print(
        f"Graaly contract {contract['contractVersion']} verified: "
        f"{len(contract['modules'])} modules, {len(contract['capabilities'])} capabilities, "
        f"surface-sha256={digest}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ContractError as failure:
        print(f"contract verification failed: {failure}", file=sys.stderr)
        raise SystemExit(1)
