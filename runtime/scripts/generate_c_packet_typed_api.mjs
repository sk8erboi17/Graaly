import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const packetPath = path.join(root, "sdk/typescript/generated-packets.mts");
const apiPath = path.join(root, "sdk/typescript/generated-api.mts");
const outTypes = path.join(root, "sdk/c/include/graaly/packet-types.h");
const outTyped = path.join(root, "sdk/c/include/graaly/packet-typed.h");
const outManifest = path.join(root, "sdk/c/packet-typed-manifest.json");

const packetText = fs.readFileSync(packetPath, "utf8");
const packetSf = ts.createSourceFile(packetPath, packetText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const apiText = fs.readFileSync(apiPath, "utf8");
const apiSf = ts.createSourceFile(apiPath, apiText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function exported(node) {
  return Boolean(node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function snake(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function stripNullable(raw) {
  return raw
    .split("|")
    .map(value => value.trim())
    .filter(value => value !== "null" && value !== "undefined")
    .join(" | ");
}

const bukkitNames = new Set();
for (const statement of apiSf.statements) {
  if (ts.isInterfaceDeclaration(statement) && exported(statement) && !statement.name.text.startsWith("__")) {
    bukkitNames.add(statement.name.text);
  }
}

const packetInterfaces = [];
const packetNames = new Set();
const symbolInterfaces = new Map();
for (const statement of packetSf.statements) {
  if (!ts.isInterfaceDeclaration(statement)) continue;
  const name = statement.name.text;
  if (name.startsWith("__GraalyPacketSymbol")) {
    symbolInterfaces.set(name.slice("__GraalyPacketSymbol".length), statement);
    continue;
  }
  if (!exported(statement) || name === "PacketTypeCatalog") continue;
  packetInterfaces.push(statement);
  packetNames.add(name);
}

function describe(typeNode) {
  if (!typeNode) return { kind: "void", raw: "void" };
  const raw = stripNullable(typeNode.getText(packetSf).trim());

  if (raw === "void") return { kind: "void", raw };
  if (raw === "boolean") return { kind: "bool", raw };
  if (raw === "number") return { kind: "number", raw };
  if (raw === "string") return { kind: "string", raw };

  const arrayMatch = raw.match(/^(?:readonly\s+)?(.+)\[\]$/);
  if (arrayMatch || /^(?:Readonly)?(?:Set|List|Collection|Iterable)<.+>$/.test(raw)) {
    return { kind: "collection", raw };
  }
  if (/^(?:Readonly)?Map<.+>$/.test(raw)) return { kind: "map", raw };
  if (/^Optional<.+>$/.test(raw)) return { kind: "optional", raw };

  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(raw)) {
    if (packetNames.has(raw)) return { kind: "handle", raw, cType: `graaly_pe_${snake(raw)}_t` };
    if (bukkitNames.has(raw)) return { kind: "handle", raw, cType: `graaly_${snake(raw)}_t` };
    return { kind: "handle", raw, cType: "graaly_object_t" };
  }
  return { kind: "unsupported", raw };
}

function resultParams(desc) {
  switch (desc.kind) {
    case "void": return [];
    case "bool": return ["bool *out"];
    case "number": return ["double *out"];
    case "string": return ["char *buffer", "size_t capacity", "size_t *required"];
    case "handle": return [`${desc.cType} *out`];
    case "collection": return ["graaly_collection_t *out"];
    case "map": return ["graaly_map_t *out"];
    case "optional": return ["graaly_optional_t *out"];
    default: return null;
  }
}

function argDecl(desc, name) {
  switch (desc.kind) {
    case "bool": return `bool ${name}`;
    case "number": return `double ${name}`;
    case "string": return `const char *${name}`;
    case "handle": return `${desc.cType} ${name}`;
    case "collection": return `graaly_collection_t ${name}`;
    case "map": return `graaly_map_t ${name}`;
    case "optional": return `graaly_optional_t ${name}`;
    default: return null;
  }
}

function argExpr(desc, name) {
  switch (desc.kind) {
    case "bool": return `graaly__value_bool(${name})`;
    case "number": return `graaly__value_f64(${name})`;
    case "string": return `${name} == NULL ? graaly__value_null() : graaly__value_string(${name})`;
    case "handle":
    case "collection":
    case "map":
    case "optional":
      return `${name}._handle == 0u ? graaly__value_null() : graaly__value_handle(${name}._handle)`;
    default: return null;
  }
}

function readHelper(desc) {
  switch (desc.kind) {
    case "bool": return "graaly__read_bool";
    case "number": return "graaly__read_number";
    case "string": return "graaly__read_string";
    case "handle":
    case "collection":
    case "map":
    case "optional": return "graaly__read_handle";
    default: return null;
  }
}

function writeHelper(desc) {
  switch (desc.kind) {
    case "bool": return "graaly__write_bool";
    case "number": return "graaly__write_number";
    case "string": return "graaly__write_string";
    case "handle":
    case "collection":
    case "map":
    case "optional": return "graaly__write_handle";
    default: return null;
  }
}

function invokeHelper(desc) {
  switch (desc.kind) {
    case "void": return "graaly__invoke_void";
    case "bool": return "graaly__invoke_bool";
    case "number": return "graaly__invoke_number";
    case "string": return "graaly__invoke_string";
    case "handle":
    case "collection":
    case "map":
    case "optional": return "graaly__invoke_handle";
    default: return null;
  }
}

function typeToken(desc) {
  return desc.kind === "handle" ? snake(desc.raw) : desc.kind;
}

const typeLines = [
  "#ifndef GRAALY_PACKET_TYPES_H",
  "#define GRAALY_PACKET_TYPES_H",
  "",
  "/* GENERATED PacketEvents/Adventure opaque handles. */",
];
for (const name of [...packetNames].sort()) {
  typeLines.push(`typedef struct { uint64_t _handle; } graaly_pe_${snake(name)}_t;`);
}
typeLines.push("", "#endif", "");
fs.writeFileSync(outTypes, typeLines.join("\n"));

const lines = [
  "#ifndef GRAALY_PACKET_TYPED_H",
  "#define GRAALY_PACKET_TYPED_H",
  "",
  "/* GENERATED strongly typed facade for PacketEvents symbols. */",
  "",
];

let properties = 0;
let writers = 0;
let methods = 0;
let constructors = 0;
let skipped = 0;

for (const iface of packetInterfaces) {
  const typeName = iface.name.text;
  const typeSnake = snake(typeName);
  const selfType = `graaly_pe_${typeSnake}_t`;
  const prefix = `graaly_pe_${typeSnake}`;
  const occupied = new Set();

  lines.push(`/* ${typeName} */`);

  if (typeName.startsWith("Wrapper")) {
    lines.push(
      `static inline graaly_status_t ${prefix}__from_event(graaly_packet_event_t event, ${selfType} *out) {`,
      "    if (out == NULL || event._handle == 0u) return GRAALY_EINVAL;",
      "    uint64_t raw = 0u;",
      `    graaly_status_t status = graaly__packet_wrap_named("${typeName}", event._handle, &raw);`,
      "    if (status == GRAALY_OK) out->_handle = raw;",
      "    return status;",
      "}",
    );
    occupied.add(`${prefix}__from_event`);
  }

  const methodGroups = new Map();
  for (const member of iface.members) {
    if (ts.isMethodSignature(member) && member.name && ts.isIdentifier(member.name)) {
      const name = member.name.text;
      if (!methodGroups.has(name)) methodGroups.set(name, []);
      methodGroups.get(name).push(member);
    }
  }

  for (const member of iface.members) {
    if (!ts.isPropertySignature(member) || !member.name || !ts.isIdentifier(member.name)) continue;
    const name = member.name.text;
    const desc = describe(member.type);
    const params = resultParams(desc);
    const helper = readHelper(desc);
    if (!params || !helper) {
      skipped++;
      continue;
    }

    const fn = `${prefix}__${snake(name)}`;
    if (occupied.has(fn)) {
      skipped++;
      continue;
    }
    if (["handle", "collection", "map", "optional"].includes(desc.kind)) {
      const outType = params[0].replace(" *out", "");
      lines.push(
        `static inline graaly_status_t ${fn}(${selfType} self, ${outType} *out) {`,
        "    if (out == NULL) return GRAALY_EINVAL;",
        "    uint64_t raw = 0u;",
        `    graaly_status_t status = ${helper}(self._handle, "${name}", &raw);`,
        "    if (status == GRAALY_OK) out->_handle = raw;",
        "    return status;",
        "}",
      );
    } else {
      lines.push(
        `static inline graaly_status_t ${fn}(${selfType} self, ${params.join(", ")}) {`,
        `    return ${helper}(self._handle, "${name}", ${desc.kind === "string" ? "buffer, capacity, required" : "out"});`,
        "}",
      );
    }
    occupied.add(fn);
    properties++;

    const readonly = member.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
    if (!readonly) {
      const helperWrite = writeHelper(desc);
      if (!helperWrite) continue;
      const writeFn = `${fn}_write`;
      if (["handle", "collection", "map", "optional"].includes(desc.kind)) {
        const cType = desc.kind === "handle" ? desc.cType
          : desc.kind === "collection" ? "graaly_collection_t"
          : desc.kind === "map" ? "graaly_map_t"
          : "graaly_optional_t";
        lines.push(
          `static inline graaly_status_t ${writeFn}(${selfType} self, ${cType} value) {`,
          `    return ${helperWrite}(self._handle, "${name}", value._handle);`,
          "}",
        );
      } else {
        const valueType = desc.kind === "bool" ? "bool"
          : desc.kind === "number" ? "double"
          : "const char *";
        lines.push(
          `static inline graaly_status_t ${writeFn}(${selfType} self, ${valueType} value) {`,
          `    return ${helperWrite}(self._handle, "${name}", value);`,
          "}",
        );
      }
      occupied.add(writeFn);
      writers++;
    }
  }

  for (const [methodName, group] of methodGroups) {
    const unique = [];
    const seen = new Set();
    for (const member of group) {
      const signature = member.getText(packetSf);
      if (seen.has(signature)) continue;
      seen.add(signature);
      unique.push(member);
    }
    const arityCounts = new Map();
    for (const member of unique) {
      const arity = member.parameters.length;
      arityCounts.set(arity, (arityCounts.get(arity) ?? 0) + 1);
    }
    const variants = [];

    for (const member of unique) {
      if (member.parameters.some(parameter => parameter.dotDotDotToken)) {
        skipped++;
        continue;
      }
      const ret = describe(member.type);
      const retParams = resultParams(ret);
      const helper = invokeHelper(ret);
      const params = member.parameters.map(parameter => describe(parameter.type));
      const decls = params.map((desc, index) => argDecl(desc, `arg${index}`));
      if (!retParams || !helper || decls.some(value => value == null)) {
        skipped++;
        continue;
      }

      let suffix = "";
      if (unique.length > 1) {
        const arity = member.parameters.length;
        suffix = arityCounts.get(arity) === 1
          ? `_${arity}`
          : "_" + (params.length ? params.map(typeToken).join("_") : "v0");
      }
      const methodBase = `${prefix}__${snake(methodName)}`;
      let fn = `${methodBase}${suffix}`;
      let collision = 2;
      while (occupied.has(fn)) {
        fn = `${methodBase}${suffix}_v${collision++}`;
      }

      const signatureDecls = [`${selfType} self`, ...decls];
      if (ret.kind === "string") {
        signatureDecls.push("char *buffer", "size_t capacity", "size_t *required");
      } else if (ret.kind !== "void") {
        signatureDecls.push(...retParams);
      }

      lines.push(`static inline graaly_status_t ${fn}(${signatureDecls.join(", ")}) {`);
      if (params.length) {
        lines.push(`    graaly__value_t args[${params.length}] = {`);
        params.forEach((desc, index) => {
          lines.push(`        ${argExpr(desc, `arg${index}`)}${index + 1 === params.length ? "" : ","}`);
        });
        lines.push("    };");
      }
      const args = params.length ? "args" : "NULL";
      if (ret.kind === "void") {
        lines.push(`    return ${helper}(self._handle, "${methodName}", ${args}, ${params.length}u);`);
      } else if (ret.kind === "string") {
        lines.push(`    return ${helper}(self._handle, "${methodName}", ${args}, ${params.length}u, buffer, capacity, required);`);
      } else if (["handle", "collection", "map", "optional"].includes(ret.kind)) {
        lines.push(
          "    if (out == NULL) return GRAALY_EINVAL;",
          "    uint64_t raw = 0u;",
          `    graaly_status_t status = ${helper}(self._handle, "${methodName}", ${args}, ${params.length}u, &raw);`,
          "    if (status == GRAALY_OK) out->_handle = raw;",
          "    return status;",
        );
      } else {
        lines.push(`    return ${helper}(self._handle, "${methodName}", ${args}, ${params.length}u, out);`);
      }
      lines.push("}");
      occupied.add(fn);
      variants.push({ fn, params, arity: params.length });
      methods++;
    }

    const natural = `${prefix}__${snake(methodName)}`;
    if (variants.length > 1 && !occupied.has(natural)) {
      const ranked = [...variants].sort((left, right) => {
        const lh = left.params.filter(desc => ["handle", "collection", "map", "optional"].includes(desc.kind)).length;
        const rh = right.params.filter(desc => ["handle", "collection", "map", "optional"].includes(desc.kind)).length;
        return (lh - rh) || (left.arity - right.arity) || left.fn.localeCompare(right.fn);
      });
      const score = item => [
        item.params.filter(desc => ["handle", "collection", "map", "optional"].includes(desc.kind)).length,
        item.arity,
      ];
      const first = score(ranked[0]);
      const second = score(ranked[1]);
      if (first[0] !== second[0] || first[1] !== second[1]) {
        lines.push(`#define ${natural} ${ranked[0].fn}`);
        occupied.add(natural);
      }
    }
  }

  const symbol = symbolInterfaces.get(typeName);
  if (symbol && typeName.startsWith("Wrapper")) {
    const constructs = symbol.members.filter(member => ts.isConstructSignatureDeclaration(member));
    const usable = [];
    for (const construct of constructs) {
      if (construct.parameters.some(parameter => parameter.dotDotDotToken)) continue;
      const params = construct.parameters.map(parameter => describe(parameter.type));
      const decls = params.map((desc, index) => argDecl(desc, `arg${index}`));
      if (decls.some(value => value == null)) {
        skipped++;
        continue;
      }
      usable.push({ construct, params, decls });
    }
    const arities = new Map();
    for (const item of usable) arities.set(item.params.length, (arities.get(item.params.length) ?? 0) + 1);

    const constructorFns = [];
    for (const item of usable) {
      const suffix = usable.length === 1 ? ""
        : arities.get(item.params.length) === 1 ? `_${item.params.length}`
        : "_" + (item.params.length ? item.params.map(typeToken).join("_") : "v0");
      let fn = `${prefix}__new${suffix}`;
      let constructorCollision = 2;
      while (occupied.has(fn)) {
        fn = `${prefix}__new${suffix}_v${constructorCollision++}`;
      }
      lines.push(`static inline graaly_status_t ${fn}(${[...item.decls, `${selfType} *out`].join(", ")}) {`);
      lines.push("    if (out == NULL) return GRAALY_EINVAL;");
      if (item.params.length) {
        lines.push(`    graaly__value_t args[${item.params.length}] = {`);
        item.params.forEach((desc, index) => {
          lines.push(`        ${argExpr(desc, `arg${index}`)}${index + 1 === item.params.length ? "" : ","}`);
        });
        lines.push("    };");
      }
      lines.push(
        "    uint64_t raw = 0u;",
        `    graaly_status_t status = graaly__packet_construct_named("${typeName}", ${item.params.length ? "args" : "NULL"}, ${item.params.length}u, &raw);`,
        "    if (status == GRAALY_OK) out->_handle = raw;",
        "    return status;",
        "}",
      );
      occupied.add(fn);
      constructorFns.push(fn);
      constructors++;
    }
    if (constructorFns.length === 1) {
      lines.push(`#define ${prefix}__new ${constructorFns[0]}`);
    }
  }

  lines.push("");
}

lines.push("#endif", "");
fs.writeFileSync(outTyped, lines.join("\n"));

const manifest = {
  exportedPacketTypes: packetInterfaces.length,
  generatedProperties: properties,
  generatedWriters: writers,
  generatedMethods: methods,
  generatedConstructors: constructors,
  skippedComplexMembers: skipped,
  files: {
    types: path.relative(root, outTypes),
    typed: path.relative(root, outTyped),
  },
};
fs.writeFileSync(outManifest, JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
