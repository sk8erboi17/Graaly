import { createWriteStream } from "node:fs";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";
import { academyProblems, coveredModules, problemTracks } from "../app/academy/catalog.ts";
import { challengeLanguages } from "../app/academy/types.ts";
import { academyLessons } from "../app/academy-data.ts";
import { resolveVariant } from "../app/academy/variants.ts";

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
// The workbook contains statements and editable starters. Explained solutions remain in the guided playground.
const workbook = new ZipArchive({ zlib: { level: 9 } });
const workbookStream = createWriteStream(output + "/Graaly-Academy-Workbook.zip");
const workbookDone = new Promise((resolve, reject) => {
  workbookStream.on("close", resolve);
  workbookStream.on("error", reject);
  workbook.on("error", reject);
});
workbook.pipe(workbookStream);
const appendWorkbook = (name, content) => workbook.append(content, {name, date:archiveDate, mode:0o644});
appendWorkbook("README.md", `# Graaly Academy coding workbook\n\n${academyProblems.length} Medium and Hard problems across ${problemTracks.length} tracks, with ${academyLessons.length} lessons.\n\nOpen https://sk8erboi17.github.io/Graaly/#academy to edit code, run examples and submit edge tests. Drafts and progress are saved on your device. After an attempt, reveal progressive hints and the explained solution.\n\nEvery problem offers JS, TS, Python, C, React (JS/TS), FastAPI, Pydantic, ASGI, Graaly plugin (JS/TS), and HTML/CSS profiles. SQL and YAML have dedicated editors for their query/configuration problems. Each profile folder contains its own execution contract and starter; an untouched starter is deliberately incomplete. Framework profiles execute the actual framework. Pure profiles model the same observable domain behavior.\n\nCoverage: ${coveredModules.join(", ")}. C includes bitsets, shifts, tagged unions, padding, serialization and ownership. Source examples for all lessons and the helper library sources are included. Java host examples require a local Bukkit server; they are not guest/browser exercises. See runtime-notes.md for build instructions and boundaries.\n`);
appendWorkbook("runtime-notes.md", await readFile(runtime + "/academy/README.md"));
appendWorkbook("helpers/graaly_academy.py",await readFile(runtime+"/academy/portable/helpers.py"));
appendWorkbook("helpers/include/graaly/academy_json.h",await readFile(runtime+"/academy/portable/academy_json.h"));
await appendTree(workbook, runtime + "/academy/json", "helpers/cjson", "");
await appendTree(workbook, runtime + "/academy/sqlite", "helpers/sqlite", "");
appendWorkbook("helpers/portable-helpers.ts", await readFile(site + "/app/academy/portable-helpers.ts"));
appendWorkbook("helpers/include/graaly/bits.h", await readFile(runtime + "/sdk/c/include/graaly/bits.h"));
for (const lesson of academyLessons) {
  const prefix = "lessons/" + String(lesson.number).padStart(3,"0") + "-" + lesson.id;
  appendWorkbook(prefix+"/lesson.json",JSON.stringify(lesson,null,2)+"\n");
  for (const file of lesson.files) appendWorkbook(prefix+"/"+file.name,file.code);
}
const curriculum = [];
for (const problem of academyProblems) {
  const {id,number,title,track,difficulty,mode,tags,modules,lessons,description,requirements,inputType,cDeclarations,sqlSchema} = problem;
  const statement = {id,number,title,track,difficulty,mode,tags,modules,lessons,description,requirements,inputType,cDeclarations,sqlSchema,examples:problem.cases.filter(test=>!test.hidden)};
  const prefix = String(number).padStart(3,"0") + "-" + id;
  appendWorkbook(prefix + "/problem.json", JSON.stringify(statement,null,2) + "\n");
  for (const language of challengeLanguages) if (problem.starters[language.id] !== undefined) {
    const execution=resolveVariant(problem,language.id);
    const profile=prefix+"/"+language.id;
    appendWorkbook(profile + "/solution." + language.extension, problem.starters[language.id]);
    appendWorkbook(profile + "/contract.json",JSON.stringify({language:language.id,mode:execution.mode,inputType:execution.inputType,note:execution.note,cDeclarations:execution.cDeclarations,cPrint:execution.cPrint,jsonFunction:execution.jsonFunction,sqlSchema:execution.sqlSchema},null,2)+"\n");
  }
  curriculum.push({id,number,title,track,difficulty,mode,modules,lessons,languages:Object.keys(problem.starters)});
}
appendWorkbook("curriculum.json", JSON.stringify({problems:curriculum,tracks:problemTracks,modules:coveredModules},null,2)+"\n");
await workbook.finalize();
await workbookDone;
console.log("Packaged public/downloads/Graaly-Academy-Workbook.zip");
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
