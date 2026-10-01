import { judgeJsCase } from "./judge-js.ts";
import { initC, compileC, runC } from "./judge-c.ts";
import { initPython, judgePythonCase } from "./judge-python.ts";
import { jsonEqual, type Challenge, type CaseResult, type JudgeResult } from "./types.ts";
import { initPortableSql } from "./portable-helpers.ts";

const send = (data: unknown) => postMessage(data);
const message = (text: string) => send({ kind: "progress", text });
onmessage = async (event: MessageEvent<{ problem: Challenge; source: string; all: boolean; base: string }>) => {
  const { problem, source, all, base } = event.data;
  const started = performance.now();
  const cases: CaseResult[] = [];
  let syntaxError = false;
  const selected = problem.cases.filter(test => all || !test.hidden);
  try {
    message("Preparing the test runner…");
    let cModule: WebAssembly.Module | undefined;
    if (problem.mode === "c") { await initC(base, message); message("Compiling C17 to WebAssembly…"); cModule = await compileC(problem, source, selected); }
    if (["python", "asgi", "pydantic", "fastapi", "sql"].includes(problem.mode)) await initPython(base, problem.mode === "fastapi", message);
    if(problem.portable && source.includes("sql_rows(") && ["function","react","plugin"].includes(problem.mode))await initPortableSql(base);
    send({ kind: "ready" });
    for (let index = 0; index < selected.length; index++) {
      const test = selected[index], at = performance.now();
      const logs: string[] = [];
      send({ kind: "case", index, total: selected.length, name: test.name });
      const original = { log: console.log, warn: console.warn, error: console.error };
      for (const key of ["log", "warn", "error"] as const) console[key] = (...values: unknown[]) => { if (logs.length < 100) logs.push(values.map(value => typeof value === "string" ? value : JSON.stringify(value)).join(" ")); };
      try {
        const actual = cModule ? await runC(cModule, index)
          : ["python", "asgi", "pydantic", "fastapi", "sql"].includes(problem.mode) ? await judgePythonCase(problem, source, test, logs)
          : await judgeJsCase(problem, source, test);
        cases.push({ name: test.name, input: test.input, expected: test.expected, actual, passed: jsonEqual(actual, test.expected), durationMs: performance.now() - at, logs });
      } catch (error) {
        syntaxError ||= error instanceof SyntaxError;
        cases.push({ name: test.name, input: test.input, expected: test.expected, passed: false, error: error instanceof Error ? error.message : String(error), durationMs: performance.now() - at, logs });
      } finally { Object.assign(console, original); }
      send({ kind: "case-result", result: cases.at(-1) });
    }
    const verdict = syntaxError ? "Compile Error" : cases.some(test => test.error) ? "Runtime Error" : cases.every(test => test.passed) ? "Accepted" : "Wrong Answer";
    send({ kind: "result", result: { verdict, cases, durationMs: performance.now() - started } satisfies JudgeResult });
  } catch (error) {
    send({ kind: "result", result: { verdict: error instanceof SyntaxError ? "Compile Error" : "Runtime Error", cases, durationMs: performance.now() - started, error: error instanceof Error ? error.message : String(error) } satisfies JudgeResult });
  }
};
