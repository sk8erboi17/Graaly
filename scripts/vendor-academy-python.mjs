import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// The npm package and its integrity-checked package lock pin the browser Python ABI.
const source = path.resolve("node_modules/pyodide");
const destination = path.resolve("public/academy/runtime/python");
await mkdir(destination, { recursive: true });
const lock = JSON.parse(await readFile(path.join(source, "pyodide-lock.json"), "utf8"));
const version = JSON.parse(await readFile(path.join(source, "package.json"), "utf8")).version;
const entries = [];
for (const file of ["LICENSE.pyodide", "LICENSE.cpython"]) {
  const bytes = await readFile(path.resolve("runtime/academy/licenses",file));
  await writeFile(path.join(destination,file),bytes);
  entries.push({file,sha256:createHash("sha256").update(bytes).digest("hex"),bytes:bytes.length});
}
for (const file of ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]) {
  await copyFile(path.join(source, file), path.join(destination, file));
  const bytes = await readFile(path.join(destination, file));
  entries.push({ file, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length });
}
const selected = new Map();
function add(name) {
  const key = Object.keys(lock.packages).find(key => key.replaceAll("_", "-") === name.replaceAll("_", "-"));
  if (!key || selected.has(key)) return;
  const item = lock.packages[key];
  selected.set(key, item);
  item.depends.forEach(add);
}
["fastapi", "pydantic", "micropip", "httpcore", "certifi", "h11", "idna"].forEach(add);
await Promise.all([...selected.values()].map(async item => {
  const url = `https://cdn.jsdelivr.net/pyodide/v${version}/full/${item.file_name}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== item.sha256) throw new Error(`Integrity failure: ${item.name}`);
  await writeFile(path.join(destination, item.file_name), bytes);
  entries.push({ file: item.file_name, sha256, bytes: bytes.length, name: item.name, version: item.version });
}));
entries.sort((a, b) => a.file.localeCompare(b.file));
await writeFile(path.join(destination, "manifest.json"), JSON.stringify({ version, python: lock.info.python, source: `https://github.com/pyodide/pyodide/tree/${version}`, files: entries }, null, 2) + "\n");
console.log(`Vendored Python ${lock.info.python} and ${selected.size} verified wheels (${version}).`);
