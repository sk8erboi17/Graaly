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
import { jsonEqual } from "../app/academy/types.ts";
import { compileNativeHtml, projectHtml } from "../app/academy/html-native.ts";
import { fixtureDOMParser } from "./helpers/native-fixture-dom.mjs";
import { startJudge } from "../app/academy/client-judge.ts";
import { academyStorageKey, writeAcademyState } from "../app/academy/storage.ts";

const root = new URL("../", import.meta.url);
const work = await mkdtemp(path.join(tmpdir(), "graaly-academy-tests-"));
const resolvePackage = createRequire(import.meta.url).resolve;
after(() => rm(work, {recursive:true,force:true}));
await build({entryPoints:["app/academy/judge-js.ts"],outfile:path.join(work,"judge-js.mjs"),bundle:true,platform:"node",format:"esm",target:"es2023",
  banner:{js:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);'},
  alias:{graaly:path.resolve("app/academy/react-host.ts")},
  plugins:[{name:"actual-node-packages",setup(build){build.onResolve({filter:/^(react|react-reconciler|yaml|sucrase)(\/.*)?$/},args=>({path:resolvePackage(args.path),external:true}));}}],
  define:{"process.env.NODE_ENV":'"development"'}});
const {judgeJsCase} = await import(pathToFileURL(path.join(work,"judge-js.mjs")));
await build({entryPoints:["app/academy/judge-c.ts"],outfile:path.join(work,"judge-c.mjs"),bundle:true,platform:"node",format:"esm",target:"es2023"});
const cJudge = await import(pathToFileURL(path.join(work,"judge-c.mjs")));
const jsModes = new Set(["function","plugin","react","manifest"]);

test("the curriculum covers every mode, SDK module and theory lesson with substantive exercises", () => {
  assert.ok(academyProblems.length >= 200);
  assert.equal(new Set(academyProblems.map(problem=>problem.id)).size,academyProblems.length);
  assert.deepEqual(new Set(academyProblems.map(problem=>problem.mode)),new Set(["function","plugin","react","python","asgi","fastapi","pydantic","html-css","sql","manifest","c"]));
  assert.deepEqual(new Set(coveredModules),new Set(["commands","players","events","worlds","entities","tasks","http","compatibility","websocket","packets","ui","config","diagnostics","boards"]));
  assert.deepEqual(new Set(academyProblems.flatMap(problem=>problem.lessons)),new Set(Array.from({length:36},(_,i)=>i+1)));
  for(const problem of academyProblems){
    assert.ok(["Medium","Hard"].includes(problem.difficulty),problem.id);
    assert.ok(problem.cases.length>=3 && problem.cases.some(test=>test.hidden) && problem.cases.some(test=>!test.hidden),problem.id);
    assert.ok(problem.hints.length>=3 && problem.explanation.length>=2 && problem.requirements.length>0,problem.id);
    assert.deepEqual(Object.keys(problem.starters).sort(),Object.keys(problem.solutions).sort(),problem.id);
    for(const lang of Object.keys(problem.starters))assert.notEqual(problem.starters[lang].trim(),problem.solutions[lang].trim(),problem.id);
  }
});

test("every JS, TS, plugin, native React and YAML reference passes and every starter is incomplete", async () => {
  const originalError=console.error;
  // Error-boundary exercises intentionally throw inside React and verify the rendered recovery surface.
  console.error=()=>{};
  try{
    for(const problem of academyProblems.filter(problem=>jsModes.has(problem.mode))){
      for(const [language,source] of Object.entries(problem.solutions))for(const fixture of problem.cases){
        const actual=await judgeJsCase(problem,source,fixture);
        assert.ok(jsonEqual(actual,fixture.expected),`${problem.id} ${language} ${fixture.name}: ${JSON.stringify(actual)} != ${JSON.stringify(fixture.expected)}`);
      }
      let accepted=true;
      try{const actual=await judgeJsCase(problem,Object.values(problem.starters)[0],problem.cases[0]);accepted=jsonEqual(actual,problem.cases[0].expected);}catch{accepted=false;}
      assert.equal(accepted,false,problem.id+" starter must fail");
    }
  }finally{console.error=originalError;}
});

test("pure functions cannot pass by mutating caller-owned input",async()=>{
  const problem={mode:"function"};
  await assert.rejects(()=>judgeJsCase(problem,"export function solve(input){input.items.sort();return input.items}",{input:{items:[2,1]},expected:[1,2]}),/preserve the caller/);
});

test("plugin judges reject unsafe thread access and missed packet reencoding",async()=>{
  const threaded=academyProblems.find(problem=>problem.id==="packet-main-thread");
  const unsafe='import {packets,ClientPacket} from "graaly"; export function setup(){packets.onReceive(ClientPacket.CHAT_MESSAGE,ctx=>ctx.player.sendMessage("Packet received"));}';
  await assert.rejects(()=>judgeJsCase(threaded,unsafe,threaded.cases[0]),/async\/network callback/);
  const packet=academyProblems.find(problem=>problem.id==="packet-health-reencode");
  const missed=packet.solutions.ts.replace("ctx.reencode();","");
  assert.equal(jsonEqual(await judgeJsCase(packet,missed,packet.cases[0]),packet.cases[0].expected),false);
});

test("actual C17 reference solutions pass all WASI cases, including SDK bits and dirty padding",async()=>{
  const originalFetch=globalThis.fetch,originalLog=console.log;
  globalThis.fetch=async url=>new Response(await readFile(new URL("../public/academy/"+String(url).replace("https://academy.local/",""),import.meta.url)));
  console.log=()=>{};
  try{
    await cJudge.initC("https://academy.local/",()=>{});
    for(const problem of academyProblems.filter(problem=>problem.mode==="c")){
      const compiled=await cJudge.compileC(problem,problem.solutions.c,problem.cases);
      for(let index=0;index<problem.cases.length;index++)assert.ok(jsonEqual(await cJudge.runC(compiled,index),problem.cases[index].expected),problem.id+": "+problem.cases[index].name);
      const starter=await cJudge.compileC(problem,problem.starters.c,problem.cases);
      let passed=true;
      for(let index=0;index<problem.cases.length;index++)passed&&=jsonEqual(await cJudge.runC(starter,index),problem.cases[index].expected);
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
  const harness=await readFile(new URL("../app/academy/python-runner.py",import.meta.url),"utf8");
  async function run(problem,source,fixture){
    runtime.globals.set("__source",source);runtime.globals.set("__mode",problem.mode);runtime.globals.set("__fixture_json",JSON.stringify(fixture.input));runtime.globals.set("__schema",problem.sqlSchema??"");
    return JSON.parse(await runtime.runPythonAsync(harness));
  }
  for(const problem of academyProblems.filter(problem=>["python","fastapi","pydantic","asgi","sql"].includes(problem.mode))){
    for(const fixture of problem.cases){const actual=await run(problem,Object.values(problem.solutions)[0],fixture);assert.ok(jsonEqual(actual,fixture.expected),`${problem.id} ${fixture.name}: ${JSON.stringify(actual)} != ${JSON.stringify(fixture.expected)}`);}
    let accepted=true;
    try{accepted=jsonEqual(await run(problem,Object.values(problem.starters)[0],problem.cases[0]),problem.cases[0].expected);}catch{accepted=false;}
    // A few SQL starters intentionally match the empty public fixture: their hidden fixtures must still reject them.
    if(accepted)for(const fixture of problem.cases.slice(1)){try{accepted&&=jsonEqual(await run(problem,Object.values(problem.starters)[0],fixture),fixture.expected);}catch{accepted=false;}}
    assert.equal(accepted,false,problem.id+" starter must fail");
  }
  const badAsgi="async def app(scope,receive,send):\n await send({'type':'http.response.body','body':b'null'})\n await send({'type':'http.response.start','status':200,'headers':[]})";
  await assert.rejects(()=>run({mode:"asgi"},badAsgi,{input:{requests:[{url:"/"}]}}),/body frames must follow/);
});

test("self-hosted runtime assets match the pinned manifests and actual SDK header",async()=>{
  for(const language of ["c","python"]){
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
