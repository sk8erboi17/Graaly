import { createWriteStream } from "node:fs";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";

const site = fileURLToPath(new URL("..", import.meta.url));
const runtime = fileURLToPath(new URL("../runtime", import.meta.url));
const examples = runtime + "/examples";
const output = fileURLToPath(new URL("../public/downloads", import.meta.url));
const archiveDate = new Date("1980-01-01T00:00:00.000Z");

const ignoredDirectories = new Set([
  "node_modules",
  ".venv",
  ".pytest_cache",
  ".ruff_cache",
  ".mypy_cache",
  "__pycache__",
]);

function shouldIgnore(name, directory) {
  if (directory) return ignoredDirectories.has(name) || name.endsWith(".egg-info");
  return name === ".DS_Store"
    || name === ".coverage"
    || name.endsWith(".pyc")
    || name.endsWith(".db")
    || name.endsWith(".sqlite")
    || name.endsWith(".log");
}

async function appendTree(archive, root, prefix, relative = "") {
  const entries = await readdir(join(root, relative), { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

  for (const entry of entries) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!shouldIgnore(entry.name, true)) await appendTree(archive, root, prefix, child);
      continue;
    }
    if (!entry.isFile() || shouldIgnore(entry.name, false)) continue;
    const contents = await readFile(join(root, ...child.split("/")));
    archive.append(contents, {
      name: `${prefix}/${child}`,
      date: archiveDate,
      mode: 0o644,
    });
  }
}

async function zipExample(folder, file) {
  await mkdir(output, { recursive: true });
  const destination = output + "/" + file;
  const stream = createWriteStream(destination);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const completed = new Promise((resolve, reject) => {
    stream.on("close", resolve);
    stream.on("error", reject);
    archive.on("error", reject);
    archive.on("warning", warning => {
      if (warning.code !== "ENOENT") reject(warning);
    });
  });
  archive.pipe(stream);
  await appendTree(archive, examples + "/" + folder, "examples/" + folder);
  for (const sdkFolder of ["typescript", "react", "react-test"]) {
    await appendTree(archive, runtime + "/sdk/" + sdkFolder, "sdk/" + sdkFolder);
  }
  await archive.finalize();
  await completed;
  console.log("Packaged " + destination.replace(site + "/", ""));
}

await zipExample("ReactFastApi.jsplugin", "Graaly-React-FastAPI.zip");
await zipExample("GraalyAcademy.jsplugin", "Graaly-Academy-Plugin.zip");
await copyFile(
  runtime + "/sdk/api-conformance-matrix.json",
  output + "/api-conformance-matrix.json",
);
console.log("Packaged public/downloads/api-conformance-matrix.json");
await copyFile(
  runtime + "/reports/compatibility/matrix.json",
  output + "/server-compatibility-matrix.json",
);
console.log("Packaged public/downloads/server-compatibility-matrix.json");
await copyFile(
  runtime + "/reports/compatibility/packetevents-26.2.json",
  output + "/packetevents-26.2.json",
);
console.log("Packaged public/downloads/packetevents-26.2.json");
