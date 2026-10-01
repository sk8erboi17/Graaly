import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { loadPyodide } from "pyodide";
import { academyProblems, coveredModules } from "../app/academy/catalog.ts";
import { academyLessons, academyTracks } from "../app/academy-data.ts";
import { universalVariants, resolveVariant } from "../app/academy/variants.ts";
import { jsonEqual } from "../app/academy/types.ts";
import { compileNativeHtml, projectHtml } from "../app/academy/html-native.ts";
import { fixtureDOMParser } from "./helpers/native-fixture-dom.mjs";
import { startJudge } from "../app/academy/client-judge.ts";
import { academyStorageKey, writeAcademyState, migrateAcademyState } from "../app/academy/storage.ts";

const root = new URL("../", import.meta.url);
const work = await mkdtemp(path.join(tmpdir(), "graaly-academy-tests-"));
const resolvePackage = createRequire(import.meta.url).resolve;
after(() => rm(work, {recursive:true,force:true}));
await build({entryPoints:["app/academy/judge-js.ts"],outfile:path.join(work,"judge-js.mjs"),bundle:true,platform:"node",format:"esm",target:"es2023",
  banner:{js:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);'},
  alias:{graaly:path.resolve("app/academy/react-host.ts")},
  plugins:[{name:"actual-node-packages",setup(build){build.onResolve({filter:/^(react|react-reconciler|yaml|sucrase)(\/.*)?$/},args=>({path:resolvePackage(args.path),external:true}));}}],
  define:{"process.env.NODE_ENV":'"development"'}});
const {judgeJsCase,initJsSql} = await import(pathToFileURL(path.join(work,"judge-js.mjs")));
await build({entryPoints:["app/academy/judge-c.ts"],outfile:path.join(work,"judge-c.mjs"),bundle:true,platform:"node",format:"esm",target:"es2023"});
const cJudge = await import(pathToFileURL(path.join(work,"judge-c.mjs")));
await initJsSql(new URL("../public/academy/",import.meta.url).href,await readFile(new URL("../public/academy/runtime/sql/sql-wasm.wasm",import.meta.url)));
const jsLanguages = ["ts","js","react-ts","react-js","plugin-ts","plugin-js","yaml"];

test("the curriculum covers every mode, SDK module and theory lesson with substantive exercises", () => {
  assert.ok(academyProblems.length >= 200);
  assert.equal(new Set(academyProblems.map(problem=>problem.id)).size,academyProblems.length);
  assert.deepEqual(new Set(academyProblems.map(problem=>problem.mode)),new Set(["function","plugin","react","python","asgi","fastapi","pydantic","html-css","sql","manifest","c"]));
  assert.deepEqual(new Set(coveredModules),new Set(["commands","players","events","worlds","entities","tasks","http","compatibility","websocket","packets","ui","config","diagnostics","boards"]));
  assert.deepEqual(new Set(academyProblems.flatMap(problem=>problem.lessons)),new Set(academyLessons.map(lesson=>lesson.number)));
  for(const problem of academyProblems){
    assert.ok(["Medium","Hard"].includes(problem.difficulty),problem.id);
    assert.ok(problem.cases.length>=3 && problem.cases.some(test=>test.hidden) && problem.cases.some(test=>!test.hidden),problem.id);
    assert.ok(problem.hints.length>=3 && problem.explanation.length>=2 && problem.requirements.length>0,problem.id);
    assert.deepEqual(Object.keys(problem.starters).sort(),Object.keys(problem.solutions).sort(),problem.id);
    for(const language of universalVariants)assert.ok(problem.starters[language]&&problem.solutions[language],problem.id+" missing "+language);
    for(const lang of Object.keys(problem.starters))assert.notEqual(problem.starters[lang].trim(),problem.solutions[lang].trim(),problem.id);
  }
});

test("every language course has authored source, lab steps and an executable practice link",()=>{
  assert.equal(academyLessons.length,84);
  assert.equal(new Set(academyLessons.map(lesson=>lesson.id)).size,academyLessons.length);
  assert.deepEqual(new Set(academyLessons.map(lesson=>lesson.track)),new Set(academyTracks));
  for(const lesson of academyLessons){
    assert.ok(lesson.explanation.length>=2&&lesson.files.length&&lesson.lab.steps.length>=3,lesson.id);
    for(const practice of lesson.practice??[]){const problem=academyProblems.find(problem=>problem.id===practice.id);assert.ok(problem?.starters[practice.language],lesson.id+" missing practice "+practice.language);}
  }
});

test("every JS, TS, plugin, native React and YAML reference passes and every starter is incomplete", async () => {
  const originalError=console.error;
  // Error-boundary exercises intentionally throw inside React and verify the rendered recovery surface.
  console.error=()=>{};
  try{
    for(const problem of academyProblems){
      for(const language of jsLanguages.filter(language=>problem.solutions[language])){
        const execution=resolveVariant(problem,language),source=problem.solutions[language];
        for(const fixture of problem.cases){
        const actual=await judgeJsCase(execution,source,fixture);
        assert.ok(jsonEqual(actual,fixture.expected),`${problem.id} ${language} ${fixture.name}: ${JSON.stringify(actual)} != ${JSON.stringify(fixture.expected)}`);
      }
      let accepted=true;
      try{const actual=await judgeJsCase(execution,problem.starters[language],problem.cases[0]);accepted=jsonEqual(actual,problem.cases[0].expected);}catch{accepted=false;}
      assert.equal(accepted,false,problem.id+" starter must fail in "+language);
      }
    }
  }finally{console.error=originalError;}
});

test("pure functions cannot pass by mutating caller-owned input",async()=>{
  const problem={mode:"function"};
  await assert.rejects(()=>judgeJsCase(problem,"export function solve(input){input.items.sort();return input.items}",{input:{items:[2,1]},expected:[1,2]}),/preserve the caller/);
  const fixture={input:{items:[2,1]},expected:[1,2]};
  await assert.rejects(()=>judgeJsCase({mode:"react",jsonFunction:"react"},'import React from "react";import{Message}from"@graaly/react";export default function App({input}){input.items.sort();return <Message>{JSON.stringify(input.items)}</Message>}',fixture),/preserve the caller/);
  assert.deepEqual(fixture.input.items,[2,1]);
});

test("plugin judges reject unsafe thread access and missed packet reencoding",async()=>{
  const threaded=academyProblems.find(problem=>problem.id==="packet-main-thread");
  const unsafe='import {packets,ClientPacket} from "graaly"; export function setup(){packets.onReceive(ClientPacket.CHAT_MESSAGE,ctx=>ctx.player.sendMessage("Packet received"));}';
  await assert.rejects(()=>judgeJsCase(resolveVariant(threaded,"plugin-ts"),unsafe,threaded.cases[0]),/async\/network callback/);
  const packet=academyProblems.find(problem=>problem.id==="packet-health-reencode");
  const missed=packet.solutions["plugin-ts"].replace("ctx.reencode();","");
  assert.equal(jsonEqual(await judgeJsCase(resolveVariant(packet,"plugin-ts"),missed,packet.cases[0]),packet.cases[0].expected),false);
});

test("the native companion paginates all 84 lessons within valid inventory slots",async()=>{
  const compiled=await build({entryPoints:["runtime/examples/GraalyAcademy.jsplugin/src/academy-app.tsx"],bundle:true,platform:"neutral",format:"cjs",jsx:"transform",tsconfigRaw:{compilerOptions:{jsx:"react"}},write:false,external:["react","@graaly/react"]});
  const source=compiled.outputFiles[0].text+'\nmodule.exports.default=module.exports.AcademyApp;';
  const catalog=await judgeJsCase({mode:"react"},source,{input:{paths:["inventory.items"]},expected:null});
  assert.equal(catalog["inventory.items"].length,39);
  assert.ok(catalog["inventory.items"].every(item=>item.slot>=0&&item.slot<54));
  const last=await judgeJsCase({mode:"react"},source,{input:{actions:[{kind:"click",slot:53},{kind:"click",slot:53},{kind:"click",slot:20}],paths:["inventory.title"]},expected:null});
  assert.equal(last["inventory.title"],"Lesson 84 · FastAPI");
});

test("actual C17 reference solutions pass all WASI cases, including SDK bits and dirty padding",async()=>{
  const originalFetch=globalThis.fetch,originalLog=console.log;
  globalThis.fetch=async url=>new Response(await readFile(new URL("../public/academy/"+String(url).replace("https://academy.local/",""),import.meta.url)));
  console.log=()=>{};
  try{
    await cJudge.initC("https://academy.local/",()=>{});
    for(const base of academyProblems){
      const problem=resolveVariant(base,"c");
      const compiled=await cJudge.compileC(problem,problem.solutions.c,problem.cases);
      for(let index=0;index<problem.cases.length;index++)assert.ok(jsonEqual(await cJudge.runC(compiled,index),problem.cases[index].expected),problem.id+": "+problem.cases[index].name);
      const starter=await cJudge.compileC(problem,problem.starters.c,problem.cases);
      let passed=true;
      try{for(let index=0;index<problem.cases.length&&passed;index++)passed&&=jsonEqual(await cJudge.runC(starter,index),problem.cases[index].expected);}catch{passed=false;}
      assert.equal(passed,false,problem.id+" incomplete starter must fail");
    }
    const wire=academyProblems.find(problem=>problem.id==="c-wire-layout");
    const littleEndian="unsigned solve(uint8_t tag,uint32_t counter){unsigned sum=tag;for(unsigned i=0;i<4;i++)sum+=((counter>>(8*i))&255)*(i+2);return sum;}";
    const wrong=await cJudge.compileC(wire,littleEndian,wire.cases);
    assert.notEqual(await cJudge.runC(wrong,0),wire.cases[0].expected,"the wire test must distinguish byte order");
    const records=academyProblems.find(problem=>problem.id==="c-fieldwise-equality");
    const memcmp=await cJudge.compileC(records,"int solve(const Record *a,const Record *b){return memcmp(a,b,sizeof *a)==0;}",records.cases);
    assert.equal(await cJudge.runC(memcmp,2),0,"dirty padding rejects bytewise equality");
    await assert.rejects(()=>cJudge.compileC(wire,"invalid C !",wire.cases),SyntaxError);
  }finally{globalThis.fetch=originalFetch;console.log=originalLog;}
});

test("real Pyodide, FastAPI, Pydantic, ASGI and SQLite execute all reference cases and reject incomplete starters",async()=>{
  const runtime=await loadPyodide({indexURL:path.resolve("public/academy/runtime/python")+"/",stdout:()=>{},stderr:()=>{}});
  await runtime.loadPackage(["fastapi","httpcore","idna"]);
  const helpers=await readFile(new URL("../runtime/academy/portable/helpers.py",import.meta.url),"utf8");
  const harness=await readFile(new URL("../app/academy/python-runner.py",import.meta.url),"utf8");
  async function run(problem,source,fixture){
    runtime.globals.set("__source",source);runtime.globals.set("__mode",problem.mode);runtime.globals.set("__fixture_json",JSON.stringify(fixture.input));runtime.globals.set("__schema",problem.sqlSchema??"");runtime.globals.set("__portable_helpers",helpers);runtime.globals.set("__json_function",problem.jsonFunction??"");
    return JSON.parse(await runtime.runPythonAsync(harness));
  }
  for(const base of academyProblems){
    for(const language of ["py","pydantic","fastapi","asgi","sql"].filter(language=>base.solutions[language])){
    const problem=resolveVariant(base,language);
    for(const fixture of problem.cases){const actual=await run(problem,problem.solutions[language],fixture);assert.ok(jsonEqual(actual,fixture.expected),`${problem.id} ${fixture.name}: ${JSON.stringify(actual)} != ${JSON.stringify(fixture.expected)}`);}
    let accepted=true;
    try{accepted=jsonEqual(await run(problem,problem.starters[language],problem.cases[0]),problem.cases[0].expected);}catch{accepted=false;}
    // A few SQL starters intentionally match the empty public fixture: their hidden fixtures must still reject them.
    if(accepted)for(const fixture of problem.cases.slice(1)){try{accepted&&=jsonEqual(await run(problem,problem.starters[language],fixture),fixture.expected);}catch{accepted=false;}}
    assert.equal(accepted,false,problem.id+" "+language+" starter must fail");
    }
  }
  const badAsgi="async def app(scope,receive,send):\n await send({'type':'http.response.body','body':b'null'})\n await send({'type':'http.response.start','status':200,'headers':[]})";
  await assert.rejects(()=>run({mode:"asgi"},badAsgi,{input:{requests:[{url:"/"}]}}),/body frames must follow/);
});

test("self-hosted runtime assets match the pinned manifests and actual SDK header",async()=>{
  for(const language of ["c","python","sql"]){
    const folder=new URL(`../public/academy/runtime/${language}/`,import.meta.url);
    const manifest=JSON.parse(await readFile(new URL("manifest.json",folder),"utf8"));
    for(const asset of manifest.files){const bytes=await readFile(new URL(asset.file,folder));assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.sha256,asset.file);assert.equal(bytes.length,asset.bytes,asset.file);}
  }
  assert.deepEqual(await readFile(new URL("public/academy/runtime/c/bits.h",root)),await readFile(new URL("runtime/sdk/c/include/graaly/bits.h",root)));
});

test("native HTML/CSS rendering matches independently generated Java fixtures",async()=>{
  const {nativeSha256,fixtures}=JSON.parse(await readFile(new URL("fixtures/academy-native-html.json",import.meta.url),"utf8"));
  const java=await readFile(new URL("runtime/src/main/java/io/github/sk8erboi17/graaly/polyglot/GraalyHtmlUiCompiler.java",root));
  assert.equal(createHash("sha256").update(java).digest("hex"),nativeSha256,"regenerate fixtures after changing the native compiler");
  const original=globalThis.DOMParser;
  try{
    for(const fixture of fixtures){
      globalThis.DOMParser=fixtureDOMParser(fixture.body);
      if(fixture.error){assert.throws(()=>compileNativeHtml(fixture.source),undefined,fixture.id);continue;}
      const actual=compileNativeHtml(fixture.source);
      assert.deepEqual(actual,fixture.snapshot,fixture.id);
      const problem=academyProblems.find(problem=>problem.id===fixture.id);
      if(problem){assert.equal(fixture.source,problem.solutions.html,"regenerate fixtures after changing HTML solutions");for(const test of problem.cases)assert.ok(jsonEqual(projectHtml(actual,test.input.paths),test.expected),problem.id+" "+test.name);}
    }
  }finally{globalThis.DOMParser=original;}
});

test("worker startup failures return control, and judges resolve assets under the GitHub Pages subpath",async()=>{
  const previous={Worker:globalThis.Worker,document:globalThis.document};
  globalThis.document={baseURI:"https://sk8erboi17.github.io/Graaly/?exercise=x#academy"};
  try{
    globalThis.Worker=class {constructor(){throw new Error("Worker is unavailable");}};
    const failure=await new Promise(resolve=>startJudge(academyProblems[0],"export function solve(){return null}",true,()=>{},resolve));
    assert.equal(failure.verdict,"Runtime Error");
    assert.match(failure.error,/Worker is unavailable/);
    let address,options,request,terminated=0;
    const captured={worker:null};
    globalThis.Worker=class {
      constructor(url,value){address=url;options=value;captured.worker=this;}
      postMessage(value){request=value;}
      terminate(){terminated++;}
    };
    const result=new Promise(resolve=>{
      const stop=startJudge(academyProblems[0],"export function solve(){return null}",true,()=>{},resolve);
      captured.worker.onmessage({data:{kind:"ready"}});
      stop();stop();
    });
    assert.equal((await result).verdict,"Stopped");
    assert.equal(address,"https://sk8erboi17.github.io/Graaly/academy/judge-worker.js");
    assert.deepEqual(options,{type:"module"});
    assert.equal(request.base,"https://sk8erboi17.github.io/Graaly/academy/");
    assert.equal(terminated,1);
  }finally{Object.assign(globalThis,previous);}
});

test("device persistence reports access/quota failure and preserves the complete draft payload",()=>{
  const state={drafts:{"exercise:ts":"export function solve(input) {\n  return input;\n}"},progress:{exercise:{attempts:1,revealed:true,solved:false}},selected:"exercise",language:"ts"};
  const serialized=JSON.stringify(state),stored=new Map();
  assert.equal(writeAcademyState(serialized,()=>({setItem:(key,value)=>stored.set(key,value)})),true);
  assert.deepEqual(JSON.parse(stored.get(academyStorageKey)),state);
  assert.equal(writeAcademyState(serialized,()=>({setItem:()=>{throw new Error("QuotaExceededError");}})),false);
  assert.equal(writeAcademyState(serialized,()=>{throw new Error("SecurityError");}),false);
  assert.equal(serialized,JSON.stringify(state),"failed persistence leaves the in-memory code/progress intact");
});

test("framework draft migration preserves user code, selection, progress and conflicting drafts",()=>{
  const old={drafts:{"react-click-counter:ts":"my original App","react-click-counter:react-ts":"my new App","api-health:py":"my FastAPI app","command-tokenizer:ts":"my pure function"},progress:{"react-click-counter":{attempts:2,solved:true}},selected:"react-click-counter",language:"ts"};
  const migrated=migrateAcademyState(old,academyProblems);
  assert.equal(migrated.language,"react-ts");
  assert.equal(migrated.drafts["react-click-counter:react-ts"],"my new App");
  assert.equal(migrated.drafts["react-click-counter:legacy-ts"],"my original App");
  assert.equal(migrated.drafts["api-health:fastapi"],"my FastAPI app");
  assert.equal(migrated.drafts["command-tokenizer:ts"],"my pure function");
  assert.equal(migrated.drafts["react-click-counter:ts"],undefined);
  assert.deepEqual(migrated.progress,old.progress);
  assert.equal(migrateAcademyState(migrated,academyProblems),migrated);
  assert.equal(old.drafts["react-click-counter:ts"],"my original App");
});
