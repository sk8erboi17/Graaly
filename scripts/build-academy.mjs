import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";

await mkdir("public/academy", { recursive: true });
await build({
  entryPoints: ["app/academy/judge-worker.ts"], outfile: "public/academy/judge-worker.js",
  bundle: true, platform: "browser", format: "esm", target: "es2022", minify: true,
  loader: { ".py": "text" },
  alias: { graaly: path.resolve("app/academy/react-host.ts"), "@graaly/react": path.resolve("runtime/sdk/react/src/index.ts"), react: path.resolve("node_modules/react"), "react-reconciler": path.resolve("node_modules/react-reconciler") },
  define: { "process.env.NODE_ENV": '"development"' },
});
console.log("Built the Academy worker with the production Graaly React renderer.");
