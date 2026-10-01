// Attribution and build sources: runtime/academy/compiler/.
import { API } from "../../runtime/academy/compiler/shared.mjs";
import type { Challenge, ChallengeCase, Json } from "./types.ts";

let compiler: InstanceType<typeof API> | undefined;
let output = "";
let sequence = 0;
export async function initC(base: string, progress: (message: string) => void) {
  if (compiler) return;
  const bytes = async (file: string) => {
    const response = await fetch(base + "runtime/c/" + file);
    if (!response.ok) throw new Error(`Cannot load C runtime: ${response.status} ${file}`);
    if (!file.endsWith(".gz")) return response.arrayBuffer();
    return new Response(response.body!.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
  };
  compiler = new API({
    hostWrite: (text: string) => { if (output.length < 128000) output += text; },
    readBuffer: bytes,
    compileStreaming: async (file: string) => { progress(`Loading C toolchain: ${file}`); return WebAssembly.compile(await bytes(file)); },
    clang: "clang.wasm.gz", lld: "lld.wasm.gz", sysroot: "sysroot.tar.gz", memfs: "memfs.wasm",
    clangResourceInclude: "/lib/clang/22/include", clangExtraArgs: ["-internal-isystem", "/include/wasm32-wasip1"],
    lldLibdir: "lib/wasm32-wasip1", lldFlags: ["--export-dynamic"], lldLibs: ["-lc", "-lclang_rt.builtins", "-lm"],
  });
  await compiler.ready;
  const bits = await fetch(base + "runtime/c/bits.h");
  if (!bits.ok) throw new Error("Cannot load the Graaly C bitset SDK header.");
  compiler.memfs.addDirectory("include/graaly");
  compiler.memfs.addFile("include/graaly/bits.h", await bits.text());
  await Promise.all([compiler.getModule(compiler.clangFilename), compiler.getModule(compiler.lldFilename)]);
}
export async function compileC(problem: Challenge, source: string, cases: ChallengeCase[]): Promise<WebAssembly.Module> {
  if (!compiler) throw new Error("C runtime is not initialized.");
  const api = compiler;
  const id = ++sequence;
  const input = `exercise${id}.c`, object = `exercise${id}.o`, wasm = `exercise${id}.wasm`;
  // All cases use one compilation; argv chooses a single independent case process.
  const harness = `\nint main(int argc, char **argv) { int test = argc > 1 ? atoi(argv[1]) : 0;\n switch(test) {\n${cases.map((test, index) => `case ${index}: { ${problem.cPrint?.replaceAll("$EXPRESSION", test.cExpression ?? "0")} break; }`).join("\n")}\n default: return 2; } return 0; }\n`;
  const contents = `#include <stdint.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <limits.h>\n${problem.cDeclarations ?? ""}\n${source}\n${harness}`;
  api.memfs.addFile(input, contents);
  output = "";
  try {
    await api.run(await api.getModule(api.clangFilename), "clang", "-cc1", "-triple", "wasm32-unknown-wasi", "-emit-obj", ...api.clangCommonArgs, "-O0", "-std=c17", "-o", object, "-x", "c", input);
  } catch (error) {
    if (/(?:fatal )?error:/.test(output)) throw new SyntaxError(output);
    throw error;
  }
  if (/(?:fatal )?error:/.test(output)) throw new SyntaxError(output);
  try { await api.link(object, wasm); }
  catch (error) { if (/error:/.test(output)) throw new SyntaxError(output); throw error; }
  if (/error:/.test(output)) throw new SyntaxError(output);
  return WebAssembly.compile(api.memfs.getFileContents(wasm));
}
export async function runC(module: WebAssembly.Module, index: number): Promise<Json> {
  output = "";
  await compiler!.run(module, "exercise.wasm", String(index));
  const lines = output.trim().split("\n").filter(Boolean);
  const line = lines.findLast((line: string) => line.startsWith("@@GRAALY@@"));
  if (!line) throw new Error("The program did not return a JSON test result. " + output.slice(-3000));
  return JSON.parse(line.slice(10));
}
