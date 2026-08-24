import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";

const projectRoot = new URL("../", import.meta.url);
const candidates = [
  process.env.GRAALY_RUNTIME_ROOT
    ? new URL(`file://${process.env.GRAALY_RUNTIME_ROOT.replace(/\/$/, "")}/`)
    : null,
  new URL("runtime/", projectRoot),
  new URL("../../Graaly/", projectRoot),
].filter(Boolean);

let runtimeRoot = null;
for (const candidate of candidates) {
  try {
    await access(new URL("contract/graaly-api.json", candidate), constants.R_OK);
    runtimeRoot = candidate;
    break;
  } catch {
    // Try the next supported checkout layout.
  }
}

if (!runtimeRoot) {
  throw new Error(
    "Graaly runtime contract not found. Set GRAALY_RUNTIME_ROOT or keep runtime/ beside the docs.",
  );
}

await mkdir(new URL("app/generated/", projectRoot), { recursive: true });
await mkdir(new URL("public/contracts/", projectRoot), { recursive: true });

const contractSource = new URL("contract/graaly-api.json", runtimeRoot);
await copyFile(contractSource, new URL("app/generated/graaly-api.json", projectRoot));
await copyFile(contractSource, new URL("public/contracts/graaly-api.json", projectRoot));

const constantsSource = new URL("contract/latest-constants.json", runtimeRoot);
const constantsCatalog = JSON.parse(await readFile(constantsSource, "utf8"));
for (const namespace of Object.values(constantsCatalog.namespaces)) {
  // The public contract documents Graaly names only; implementation class paths
  // remain an adapter concern inside the runtime JAR.
  delete namespace.runtimeType;
}
const publicConstants = `${JSON.stringify(constantsCatalog, null, 2)}\n`;
await writeFile(new URL("app/generated/latest-constants.json", projectRoot), publicConstants);
await writeFile(new URL("public/contracts/latest-constants.json", projectRoot), publicConstants);

console.log(`Synced Graaly contract from ${runtimeRoot.pathname}`);
