import harness from "./python-runner.py";
import portableHelpers from "../../runtime/academy/portable/helpers.py";
import type { Challenge, ChallengeCase, Json } from "./types.ts";

type PythonRuntime = {
  loadPackage: (names: string[]) => Promise<void>;
  runPythonAsync: (source: string) => Promise<string>;
  globals: { set: (key: string, value: unknown) => void };
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
};
let runtime: PythonRuntime | undefined;
let fastapiLoaded = false;
export async function initPython(base: string, fastapi: boolean, progress: (message: string) => void): Promise<void> {
  if (!runtime) {
    progress("Loading Python 3.14 runtime…");
    const pythonModule = await import(/* @vite-ignore */ base + "runtime/python/pyodide.mjs");
    runtime = await pythonModule.loadPyodide({ indexURL: base + "runtime/python/" });
    await runtime!.loadPackage(["pydantic"]);
  }
  if (fastapi && !fastapiLoaded) {
    progress("Loading FastAPI and its Pydantic / ASGI dependencies…");
    await runtime!.loadPackage(["fastapi", "httpcore", "idna"]);
    fastapiLoaded = true;
  }
}
export async function judgePythonCase(problem: Challenge, source: string, test: ChallengeCase, logs: string[]): Promise<Json> {
  if (!runtime) throw new Error("Python is not initialized.");
  runtime.setStdout({ batched: text => { if (logs.length < 100) logs.push(text); } });
  runtime.setStderr({ batched: text => { if (logs.length < 100) logs.push(text); } });
  runtime.globals.set("__source", source);
  runtime.globals.set("__mode", problem.mode);
  runtime.globals.set("__fixture_json", JSON.stringify(test.input));
  runtime.globals.set("__schema", problem.sqlSchema ?? "");
  runtime.globals.set("__portable_helpers", portableHelpers);
  runtime.globals.set("__json_function", problem.jsonFunction ?? "");
  return JSON.parse(await runtime.runPythonAsync(harness));
}
