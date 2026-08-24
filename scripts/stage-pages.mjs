import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const builtSite = new URL("dist/client/", projectRoot);
const pagesDirectory = new URL("docs/", projectRoot);

// `docs/` is a generated GitHub Pages artifact. Replacing the exact directory
// prevents old hashed chunks from surviving a new build.
await rm(pagesDirectory, { recursive: true, force: true });
await mkdir(pagesDirectory, { recursive: true });
await cp(builtSite, pagesDirectory, { recursive: true });
await writeFile(new URL(".nojekyll", pagesDirectory), "");

console.log("GitHub Pages staged in docs/");
