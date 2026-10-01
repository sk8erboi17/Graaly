// Attribution and build sources: runtime/academy/compiler/.
import { API } from "../../runtime/academy/compiler/shared.mjs";
import type { Challenge, ChallengeCase, Json } from "./types.ts";

let compiler: InstanceType<typeof API> | undefined;
let output = "";
let sequence = 0;
let jsonLibraryReady=false,sqliteLibraryReady=false;
let runtimeBase="";
export async function initC(base: string, progress: (message: string) => void) {
  if (compiler) return;
  runtimeBase=base;
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
  const files=["cJSON.h","cJSON.c","sqlite3.h","academy_json.h"];
  for(const file of files){const response=await fetch(base+"runtime/c/"+file);if(!response.ok)throw Error("Cannot load C library: "+file);compiler.memfs.addFile(file.endsWith(".h")?"include/"+(file==="academy_json.h"?"graaly/":"")+file:file,await response.text());}
}
async function compileLibrary(file:string,flags:string[]=[]){
  output="";await compiler!.run(await compiler!.getModule(compiler!.clangFilename),"clang","-cc1","-triple","wasm32-unknown-wasi","-emit-obj",...compiler!.clangCommonArgs,"-O1","-std=c17",...flags,"-o",file+".o","-x","c",file+".c");
  if(/(?:fatal )?error:/.test(output))throw new SyntaxError(output);
}
export async function compileC(problem: Challenge, source: string, cases: ChallengeCase[]): Promise<WebAssembly.Module> {
  if (!compiler) throw new Error("C runtime is not initialized.");
  const api = compiler;
  const id = ++sequence;
  const input = `exercise${id}.c`, object = `exercise${id}.o`, wasm = `exercise${id}.wasm`;
  // All cases use one compilation; argv chooses a single independent case process.
  if(problem.jsonFunction==="c"){
    if(!jsonLibraryReady){await compileLibrary("cJSON");jsonLibraryReady=true;}
    if(source.includes("j_sql_rows(")&&!sqliteLibraryReady){for(const file of ["sqlite3.c","academy-vfs.c"]){const response=await fetch(runtimeBase+"runtime/c/"+file);if(!response.ok)throw Error("Cannot load SQLite C source.");api.memfs.addFile(file,await response.text());}await compileLibrary("sqlite3",["-DSQLITE_THREADSAFE=0","-DSQLITE_OMIT_LOAD_EXTENSION=1","-DSQLITE_OMIT_WAL=1","-DSQLITE_OS_OTHER=1","-DSQLITE_TEMP_STORE=3"]);await compileLibrary("academy-vfs");sqliteLibraryReady=true;}
  }
  const cString=(value:unknown)=>JSON.stringify(JSON.stringify(value)).replace(/[^\x20-\x7e]/gu,char=>{const bytes=new TextEncoder().encode(char);return Array.from(bytes,byte=>"\\"+byte.toString(8).padStart(3,"0")).join("");});
  const jsonCase=(test:ChallengeCase)=>`J *input=j_track(cJSON_Parse(${cString(test.input)})); J *before=j_clone(input); J *result=solve(input); if(!j_equal(input,before))academy_error("solve(input) must preserve the caller's input."); char *json=cJSON_PrintUnformatted(result); if(!json)academy_error("solve must return a JSON value"); printf("@@GRAALY@@%s\\n",json); free(json);academy_clear();`;
  const harness = `\nint main(int argc, char **argv) { int test = argc > 1 ? atoi(argv[1]) : 0;\n switch(test) {\n${cases.map((test, index) => `case ${index}: { ${problem.jsonFunction==="c"?jsonCase(test):problem.cPrint?.replaceAll("$EXPRESSION", test.cExpression ?? "0")} break; }`).join("\n")}\n default: return 2; } return 0; }\n`;
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
  const previousLibs=api.lldLibs;
  if(problem.jsonFunction==="c")api.lldLibs=["cJSON.o",...(source.includes("j_sql_rows(")?["sqlite3.o","academy-vfs.o"]:[]),...previousLibs];
  try { await api.link(object, wasm); }
  catch (error) { if (/error:/.test(output)) throw new SyntaxError(output); throw error; }
  finally{api.lldLibs=previousLibs;}
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
