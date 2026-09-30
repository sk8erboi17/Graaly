import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { bukkitCatalog, packetSupportTypeCatalog, packetWrapperCatalog } from "../app/generated-api-reference.ts";

const root = new URL("../", import.meta.url);
const destination = new URL("public/contracts/c-reference/", root);
const namespaces = { bukkit: new Map(), packets: new Map() };
const snake = name => name.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
  .replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9]+/g, "_").toLowerCase();

for (const [namespace, catalog] of [
  ["bukkit", bukkitCatalog], ["packets", [...packetSupportTypeCatalog, ...packetWrapperCatalog]],
]) {
  for (const entry of catalog) {
    const stem = `${namespace === "packets" ? "graaly_pe" : "graaly"}_${snake(entry.name)}`;
    namespaces[namespace].set(entry.name, {
      handle: `${stem}_t`, prefix: `${stem}${namespace === "packets" ? "__" : "_"}`, functions: [],
    });
  }
  const header = await readFile(new URL(
    `runtime/sdk/c/include/graaly/${namespace === "packets" ? "packet-typed" : "typed"}.h`, root), "utf8");
  const blocks = [...header.matchAll(/^\/\* ([\w$]+) \*\/\n([\s\S]*?)(?=^\/\* [\w$]+ \*\/|\n#endif)/gm)];
  for (const [, name, body] of blocks) {
    const entry = namespaces[namespace].get(name);
    if (!entry) throw new Error(`C header has no matching documentation type: ${name}`);
    const declarations = new Map();
    for (const [, fn, params, implementation] of body.matchAll(
      /^static inline graaly_status_t (\w+)\(([^\n]*)\) \{\n([\s\S]*?)^\}/gm,
    )) {
      const kind = /graaly__packet_construct_named/.test(implementation) ? 2
        : /graaly__(?:read|write)_/.test(implementation) ? 0 : 1;
      const declaration = [kind, fn.slice(entry.prefix.length), params.replaceAll(entry.handle, "$self")];
      entry.functions.push(declaration);
      declarations.set(fn, declaration);
    }
    for (const [, alias, target] of body.matchAll(/^#define (graaly_\w+) (graaly_\w+)$/gm)) {
      const declaration = declarations.get(target);
      if (!declaration || alias === target) continue;
      entry.functions.push([declaration[0], alias.slice(entry.prefix.length), declaration[2]]);
    }
  }
}

// Include the hand-written typed module entrypoints, such as player_find and location_make.
const facade = await readFile(new URL("runtime/sdk/c/include/graaly/graaly.h", root), "utf8");
const publicFacade = facade.slice(facade.indexOf("/*\n * Preferred C-native module facade."));
const types = [...namespaces.bukkit.values()].sort((a, b) => b.prefix.length - a.prefix.length);
for (const [, fn, multilineParams] of publicFacade.matchAll(/graaly_status_t (graaly_\w+)\(([\s\S]*?)\);/g)) {
  const entry = types.find(type => fn.startsWith(type.prefix));
  if (!entry) continue;
  const suffix = fn.slice(entry.prefix.length);
  if (entry.functions.some(item => item[1] === suffix)) continue;
  const params = multilineParams.replace(/\s+/g, " ").trim().replaceAll(entry.handle, "$self");
  entry.functions.push([/(?:^make$|^create$|^spawn_at$)/.test(suffix) ? 2 : 1, suffix, params]);
}

const constants = await readFile(new URL("runtime/sdk/c/include/graaly/catalog.h", root), "utf8");
const contractConstants = JSON.parse(await readFile(new URL("runtime/contract/latest-constants.json", root), "utf8"));
for (const name of Object.keys(contractConstants.namespaces)) {
  const entry = namespaces.bukkit.get(name);
  if (!entry) continue;
  const prefix = `GRAALY_${name.toUpperCase()}_`;
  for (const [, macro, value] of constants.matchAll(/^#define (GRAALY_\w+) ("[^"\n]*")$/gm)) {
    if (macro.startsWith(prefix)) entry.functions.push([3, macro, value]);
  }
}

await rm(destination, { recursive: true, force: true });
let total = 0;
for (const [namespace, entries] of Object.entries(namespaces)) {
  const buckets = new Map();
  for (const [name, entry] of entries) {
    const initial = name[0].toUpperCase();
    if (!buckets.has(initial)) buckets.set(initial, { parameters: [], types: {}, pool: new Map() });
    const bucket = buckets.get(initial);
    bucket.types[name] = {
      handle: entry.handle, prefix: entry.prefix,
      functions: entry.functions.map(([kind, suffix, params]) => {
        if (!bucket.pool.has(params)) {
          bucket.pool.set(params, bucket.parameters.length);
          bucket.parameters.push(params);
        }
        total++;
        return [kind, suffix, bucket.pool.get(params)];
      }),
    };
  }
  await mkdir(new URL(`${namespace}/`, destination), { recursive: true });
  for (const [initial, { parameters, types: entriesInBucket }] of buckets) {
    await writeFile(new URL(`${namespace}/${initial}.json`, destination),
      JSON.stringify({ parameters, types: entriesInBucket }) + "\n");
  }
}

const labs = await readFile(new URL("runtime/examples/EducationalC.cplugin/src/c-labs.h", root), "utf8");
const sections = Object.fromEntries([...labs.matchAll(/\/\* docs:([\w-]+):start \*\/\n([\s\S]*?)\/\* docs:\1:end \*\//g)]
  .map(([, id, code]) => [id, code.trim()]));
const examples = Object.fromEntries(Object.entries(sections).map(([id, code]) => [id,
  `#include <graaly/bits.h>\n#include <stdlib.h>\n\n${id === "serialization" ? sections.padding + "\n\n" : ""}${code}\n`]));
const packetSource = await readFile(new URL("runtime/examples/PacketEventsC.cplugin/src/main.c", root), "utf8");
const packetSections = Object.fromEntries([...packetSource.matchAll(/\/\* docs:([\w-]+):start \*\/\n([\s\S]*?)\/\* docs:\1:end \*\//g)]
  .map(([, id, code]) => [id, code.trim()]));
const packetExamples = Object.fromEntries(Object.entries(packetSections).map(([id, code]) => {
  const dependencies = id === "wrap-read-change" ? ["packet-thread-handoff"]
    : id === "receive-packet" ? ["packet-thread-handoff", "wrap-read-change"] : [];
  return [id, ["#include <graaly/packets.h>", "#include <stdio.h>", "#include <string.h>", "",
    ...dependencies.map(key => packetSections[key]), code].join("\n\n")];
}));
packetExamples["cancel-reencode"] = packetExamples["wrap-read-change"];
await writeFile(new URL("app/generated-c-learning.ts", root),
  `/* Generated from the compiled EducationalC and PacketEventsC examples. */\nexport const cLabExamples: Record<string, string> = ${JSON.stringify(examples, null, 2)};\n\nexport const cPacketExamples: Record<string, string> = ${JSON.stringify(packetExamples, null, 2)};\n`);
console.log(`Generated ${total} real C declarations for ${namespaces.bukkit.size + namespaces.packets.size} types and ${Object.keys(examples).length} C labs.`);
