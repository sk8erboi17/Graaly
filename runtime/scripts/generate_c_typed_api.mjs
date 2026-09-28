import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "sdk/typescript/generated-api.mts");
const outTypes = path.join(root, "sdk/c/include/graaly/types.h");
const outTyped = path.join(root, "sdk/c/include/graaly/typed.h");
const outManifest = path.join(root, "sdk/c/typed-manifest.json");

const sourceText = fs.readFileSync(sourcePath, "utf8");
const sf = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function snake(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function exported(node) {
  return Boolean(node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

const interfaces = [];
const exportedNames = new Set();
for (const statement of sf.statements) {
  if (!ts.isInterfaceDeclaration(statement) || !exported(statement)) continue;
  const name = statement.name.text;
  if (name.startsWith("__")) continue;
  interfaces.push(statement);
  exportedNames.add(name);
}

function stripNullable(raw) {
  return raw
    .split("|")
    .map(value => value.trim())
    .filter(value => value !== "null" && value !== "undefined")
    .join(" | ");
}

function describe(typeNode) {
  if (!typeNode) return { kind: "void", raw: "void" };
  const raw = stripNullable(typeNode.getText(sf).trim());
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
    if (exportedNames.has(raw)) return { kind: "handle", raw, cType: `graaly_${snake(raw)}_t` };
    if (/^(Native|Api)/.test(raw)) return { kind: "handle", raw, cType: "graaly_object_t" };
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
      return `${name}._handle == 0 ? graaly__value_null() : graaly__value_handle(${name}._handle)`;
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
    case "optional":
      return "graaly__read_handle";
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
    case "optional":
      return "graaly__write_handle";
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
    case "optional":
      return "graaly__invoke_handle";
    default: return null;
  }
}

function typeToken(desc) {
  if (desc.kind === "handle") return snake(desc.raw);
  return desc.kind;
}

const typesLines = [
  "#ifndef GRAALY_TYPES_H",
  "#define GRAALY_TYPES_H",
  "",
  "#include <stdint.h>",
  "",
  "typedef struct { uint64_t _handle; } graaly_object_t;",
  "typedef struct { uint64_t _handle; } graaly_sender_t;",
  "typedef struct { uint64_t _handle; } graaly_packet_t;",
  "typedef struct { uint64_t _handle; } graaly_packet_event_t;",
  "typedef struct { uint64_t _handle; } graaly_packet_type_t;",
  "typedef struct { uint64_t _handle; } graaly_packet_binding_t;",
  "typedef struct { uint64_t _handle; } graaly_packet_user_t;",
  "typedef struct { uint64_t _handle; } graaly_client_version_t;",
  "typedef struct { char id[37]; } graaly_http_request_t;",
  "typedef struct { char id[37]; } graaly_websocket_t;",
  "typedef struct { uint64_t _handle; } graaly_collection_t;",
  "typedef struct { uint64_t _handle; } graaly_map_t;",
  "typedef struct { uint64_t _handle; } graaly_optional_t;",
  "typedef struct { uint64_t _handle; } graaly_event_t;",
  "",
];
for (const name of [...exportedNames].sort()) {
  const c = snake(name);
  if (["object", "collection", "map", "optional", "event"].includes(c)) continue;
  typesLines.push(`typedef struct { uint64_t _handle; } graaly_${c}_t;`);
}
typesLines.push("", "#endif", "");
fs.mkdirSync(path.dirname(outTypes), { recursive: true });
fs.writeFileSync(outTypes, typesLines.join("\n"));

const typedLines = [
  "#ifndef GRAALY_TYPED_H",
  "#define GRAALY_TYPED_H",
  "",
  "/* GENERATED: typed C facade over the private Graaly ABI. */",
  "/* Prefer these functions over graaly_get/graaly_set/graaly_call. */",
  "",
];

let generatedProperties = 0;
let generatedWriters = 0;
let generatedMethods = 0;
let skippedMethods = 0;

for (const iface of interfaces) {
  const typeName = iface.name.text;
  const typeSnake = snake(typeName);
  const selfType = `graaly_${typeSnake}_t`;

  const methodGroups = new Map();
  const occupiedFunctions = new Set();
  for (const member of iface.members) {
    if (!ts.isMethodSignature(member) || !member.name || !ts.isIdentifier(member.name)) continue;
    const name = member.name.text;
    if (!methodGroups.has(name)) methodGroups.set(name, []);
    methodGroups.get(name).push(member);
  }

  typedLines.push(`/* ${typeName} */`);

  for (const member of iface.members) {
    if (!ts.isPropertySignature(member) || !member.name || !ts.isIdentifier(member.name)) continue;
    const property = member.name.text;
    const desc = describe(member.type);
    const params = resultParams(desc);
    const helper = readHelper(desc);
    if (!params || !helper) continue;

    const base = `graaly_${typeSnake}_${snake(property)}`;
    if (desc.kind === "handle" || desc.kind === "collection" || desc.kind === "map" || desc.kind === "optional") {
      const outType = params[0].replace(" *out", "");
      typedLines.push(
        `static inline graaly_status_t ${base}(${selfType} self, ${outType} *out) {`,
        "    if (out == NULL) return GRAALY_EINVAL;",
        "    uint64_t raw = 0;",
        `    graaly_status_t status = ${helper}(self._handle, "${property}", &raw);`,
        "    if (status == GRAALY_OK) out->_handle = raw;",
        "    return status;",
        "}",
      );
    } else {
      typedLines.push(
        `static inline graaly_status_t ${base}(${selfType} self, ${params.join(", ")}) {`,
        `    return ${helper}(self._handle, "${property}", ${desc.kind === "string" ? "buffer, capacity, required" : "out"});`,
        "}",
      );
    }
    occupiedFunctions.add(base);
    generatedProperties++;

    const readonly = member.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
    if (!readonly) {
      const writer = writeHelper(desc);
      if (writer) {
        const name = `${base}_write`;
        if (desc.kind === "handle" || desc.kind === "collection" || desc.kind === "map" || desc.kind === "optional") {
          const cType = desc.kind === "handle" ? desc.cType
            : desc.kind === "collection" ? "graaly_collection_t"
            : desc.kind === "map" ? "graaly_map_t"
            : "graaly_optional_t";
          typedLines.push(
            `static inline graaly_status_t ${name}(${selfType} self, ${cType} value) {`,
            `    return ${writer}(self._handle, "${property}", value._handle);`,
            "}",
          );
        } else {
          const valueType = desc.kind === "bool" ? "bool"
            : desc.kind === "number" ? "double"
            : "const char *";
          typedLines.push(
            `static inline graaly_status_t ${name}(${selfType} self, ${valueType} value) {`,
            `    return ${writer}(self._handle, "${property}", value);`,
            "}",
          );
        }
        occupiedFunctions.add(name);
        generatedWriters++;
      }
    }
  }

  for (const [methodName, members] of methodGroups) {
    const unique = [];
    const seen = new Set();
    for (const member of members) {
      const signature = member.getText(sf);
      if (seen.has(signature)) continue;
      seen.add(signature);
      unique.push(member);
    }
    const arityCounts = new Map();
    for (const member of unique) {
      const arity = member.parameters.length;
      arityCounts.set(arity, (arityCounts.get(arity) ?? 0) + 1);
    }

    let methodIndex = 0;
    const generatedVariants = [];
    for (const member of unique) {
      methodIndex++;
      if (member.parameters.some(parameter => parameter.dotDotDotToken)) {
        skippedMethods++;
        continue;
      }
      const returnDesc = describe(member.type);
      const returnParams = resultParams(returnDesc);
      const helper = invokeHelper(returnDesc);
      if (!returnParams || !helper) {
        skippedMethods++;
        continue;
      }

      const paramDescs = member.parameters.map(parameter => describe(parameter.type));
      const paramDecls = paramDescs.map((desc, index) => argDecl(desc, `arg${index}`));
      if (paramDecls.some(value => value == null)) {
        skippedMethods++;
        continue;
      }

      let suffix = "";
      if (unique.length > 1) {
        const arity = member.parameters.length;
        if (arityCounts.get(arity) === 1) {
          suffix = `_${arity}`;
        } else {
          suffix = "_" + (paramDescs.length ? paramDescs.map(typeToken).join("_") : `v${methodIndex}`);
        }
      }
      const baseMethod = `graaly_${typeSnake}_${snake(methodName)}`;
      let fn = `${baseMethod}${suffix}`;
      if (occupiedFunctions.has(fn)) {
        fn = `${fn}_call`;
      }

      const decls = [`${selfType} self`, ...paramDecls];
      if (returnDesc.kind === "string") {
        decls.push("char *buffer", "size_t capacity", "size_t *required");
      } else if (returnDesc.kind !== "void") {
        decls.push(...returnParams);
      }

      typedLines.push(`static inline graaly_status_t ${fn}(${decls.join(", ")}) {`);
      if (paramDescs.length) {
        typedLines.push(`    graaly__value_t args[${paramDescs.length}] = {`);
        paramDescs.forEach((desc, index) => {
          typedLines.push(`        ${argExpr(desc, `arg${index}`)}${index === paramDescs.length - 1 ? "" : ","}`);
        });
        typedLines.push("    };");
      }
      const argsExpr = paramDescs.length ? "args" : "NULL";
      const countExpr = `${paramDescs.length}u`;
      if (returnDesc.kind === "void") {
        typedLines.push(`    return ${helper}(self._handle, "${methodName}", ${argsExpr}, ${countExpr});`);
      } else if (returnDesc.kind === "string") {
        typedLines.push(`    return ${helper}(self._handle, "${methodName}", ${argsExpr}, ${countExpr}, buffer, capacity, required);`);
      } else if (returnDesc.kind === "handle" || returnDesc.kind === "collection" || returnDesc.kind === "map" || returnDesc.kind === "optional") {
        typedLines.push(
          "    if (out == NULL) return GRAALY_EINVAL;",
          "    uint64_t raw = 0;",
          `    graaly_status_t status = ${helper}(self._handle, "${methodName}", ${argsExpr}, ${countExpr}, &raw);`,
          "    if (status == GRAALY_OK) out->_handle = raw;",
          "    return status;",
        );
      } else {
        typedLines.push(`    return ${helper}(self._handle, "${methodName}", ${argsExpr}, ${countExpr}, out);`);
      }
      typedLines.push("}");
      occupiedFunctions.add(fn);
      generatedVariants.push({ fn, paramDescs, arity: member.parameters.length });
      generatedMethods++;
    }

    const naturalName = `graaly_${typeSnake}_${snake(methodName)}`;
    if (generatedVariants.length > 1 && !occupiedFunctions.has(naturalName)) {
      const ranked = [...generatedVariants].sort((left, right) => {
        const leftHandles = left.paramDescs.filter(desc => ["handle", "collection", "map", "optional"].includes(desc.kind)).length;
        const rightHandles = right.paramDescs.filter(desc => ["handle", "collection", "map", "optional"].includes(desc.kind)).length;
        return (leftHandles - rightHandles) || (left.arity - right.arity) || left.fn.localeCompare(right.fn);
      });
      const score = variant => {
        const handles = variant.paramDescs.filter(desc => ["handle", "collection", "map", "optional"].includes(desc.kind)).length;
        return [handles, variant.arity];
      };
      const firstScore = score(ranked[0]);
      const secondScore = score(ranked[1]);
      if (firstScore[0] !== secondScore[0] || firstScore[1] !== secondScore[1]) {
        typedLines.push(`#define ${naturalName} ${ranked[0].fn}`);
        occupiedFunctions.add(naturalName);
      }
    }
  }

  typedLines.push("");
}
typedLines.push("#endif", "");
fs.writeFileSync(outTyped, typedLines.join("\n"));

const manifest = {
  exportedTypes: interfaces.length,
  generatedProperties,
  generatedWriters,
  generatedMethods,
  skippedMethods,
  files: {
    types: path.relative(root, outTypes),
    typed: path.relative(root, outTyped),
  },
};
fs.writeFileSync(outManifest, JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
