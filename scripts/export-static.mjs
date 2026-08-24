import { writeFile } from "node:fs/promises";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("export", String(Date.now()));
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("http://localhost/", {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error("Static export failed with HTTP " + response.status);
}

const html = (await response.text()).replaceAll("/_next/", "./_next/");
await writeFile(new URL("../dist/client/index.html", import.meta.url), html);
console.log("Static documentation exported to dist/client/index.html");
