import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { academyProblems } from "../../app/academy/catalog.ts";

async function openProblem(page:Page,id=academyProblems[0].id,language="ts"){
  await page.goto(`/?exercise=${id}&language=${language}#academy`);
  const arena=page.getByTestId("graaly-arena");
  await expect(arena).toBeVisible();
  await expect(arena.locator(".arena-problem-heading h4")).toContainText(academyProblems.find(problem=>problem.id===id)!.title);
  await expect(arena.getByTestId("academy-editor")).toBeVisible();
  return arena;
}
async function edit(page:Page,source:string){
  const editor=page.getByTestId("academy-editor");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText(source);
}
async function submit(page:Page){
  await page.getByTestId("graaly-arena").getByRole("button",{name:"Submit all tests",exact:true}).click();
}
async function expectFits(page:Page){
  const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
}

test("a real attempt unlocks the editorial, assisted acceptance and persisted progress",async({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  const problem=academyProblems[0],arena=await openProblem(page);
  await expect(arena.getByRole("button",{name:"Submit all tests",exact:true})).toBeDisabled();
  await arena.getByRole("tab",{name:"Editorial",exact:true}).click();
  await expect(arena.getByRole("button",{name:"Submit an attempt to unlock the solution"})).toBeDisabled();
  await arena.getByRole("button",{name:"Reveal next hint"}).click();
  await expect(arena).toContainText("Hint 1");
  await edit(page,"export function solve(input) { return null; }");
  await submit(page);
  await expect(arena.locator(".arena-verdict strong")).toHaveText("Wrong Answer",{timeout:30_000});
  await arena.getByRole("tab",{name:"Editorial",exact:true}).click();
  await arena.getByRole("button",{name:"Reveal explained solution"}).click();
  await expect(arena).toContainText("Solution explained");
  await arena.getByRole("button",{name:"Load solution into editor"}).click();
  await submit(page);
  await expect(arena.locator(".arena-verdict strong")).toHaveText("Accepted",{timeout:30_000});
  await expect(arena.locator(".arena-problem-heading")).toContainText("Accepted · assisted");
  await expect.poll(()=>page.evaluate(id=>JSON.parse(localStorage.getItem("graaly.academy.arena.v1")??"{}").progress?.[id]?.solved,problem.id)).toBe(true);
  await page.reload();
  await expect(arena.locator(".arena-problem-heading")).toContainText("Accepted · assisted");
  await expect(arena.getByTestId("academy-editor")).toContainText("export function solve");
  await expectFits(page);
  expect(errors).toEqual([]);
});

test("examples do not mark acceptance, language-specific drafts survive reload, and filters cover every integration",async({page})=>{
  const problem=academyProblems[0],arena=await openProblem(page);
  await edit(page,problem.solutions.ts!);
  await arena.getByRole("button",{name:"Run examples",exact:true}).click();
  await expect(arena.locator(".arena-verdict strong")).toHaveText("Examples passed",{timeout:30_000});
  await expect(arena.locator(".arena-problem-heading .is-accepted")).toHaveCount(0);
  await arena.getByLabel("Solution language").selectOption("js");
  await expect(page).toHaveURL(/language=js/);
  await edit(page,"export function solve(input) { return 'my JavaScript draft'; }");
  await expect.poll(()=>page.evaluate(id=>JSON.parse(localStorage.getItem("graaly.academy.arena.v1")??"{}").drafts?.[id+":js"],problem.id)).toContain("my JavaScript draft");
  await page.reload();
  await expect(arena.getByLabel("Solution language")).toHaveValue("js");
  await expect(arena.getByTestId("academy-editor")).toContainText("my JavaScript draft");
  await arena.getByLabel("Solution language").selectOption("ts");
  await expect(arena.getByTestId("academy-editor")).toContainText(problem.solutions.ts!.split("\n").find(line=>line.trim().startsWith("export"))!);
  for(const track of ["FastAPI / ASGI","Pydantic","HTML / CSS","C / WebAssembly","SQL / persistence","Manifests and config"]){
    await arena.getByLabel("Problem track").selectOption(track);
    await expect(arena.locator(".arena-problems button")).toHaveCount(academyProblems.filter(problem=>problem.track===track).length);
  }
  await expectFits(page);
});

test("the coding editor links directly to the related theory lesson",async({page})=>{
  const problem=academyProblems.find(problem=>problem.lessons.length>0)!;
  const arena=await openProblem(page,problem.id);
  await arena.locator(".arena-lesson-links button").first().click();
  await expect(page.getByRole("tablist",{name:"Academy view"}).getByRole("tab",{name:"Lessons",exact:true})).toHaveAttribute("aria-selected","true");
  await expect(page.locator(".academy-lesson-header")).toContainText(String(problem.lessons[0]).padStart(2,"0"));
});

test("unavailable device storage is reported and coding submissions still work",async({page},info)=>{
  test.skip(info.project.name!=="desktop","storage error recovery is covered once");
  await page.addInitScript(()=>{const setItem=Storage.prototype.setItem;Object.defineProperty(Storage.prototype,"setItem",{value:function(this:Storage,key:string,value:string){if(key==="graaly.academy.arena.v1")throw new DOMException("Storage quota exhausted","QuotaExceededError");setItem.call(this,key,value);}});});
  const problem=academyProblems[0],arena=await openProblem(page);
  await expect(arena).toContainText("Device storage unavailable. Download your code to keep a copy.");
  await edit(page,problem.solutions.ts!);
  await submit(page);
  await expect(arena.locator(".arena-verdict strong")).toHaveText("Accepted",{timeout:30_000});
  await expect(arena.getByTestId("academy-editor")).toContainText("export function solve");
});

for(const storageFailure of ["denied","invalid-json"]){
  test(`exercise links preserve the problem and language with ${storageFailure} storage`,async({page},info)=>{
    test.skip(info.project.name!=="desktop","storage restoration recovery is covered once");
    await page.addInitScript(failure=>{const getItem=Storage.prototype.getItem;Object.defineProperty(Storage.prototype,"getItem",{value:function(this:Storage,key:string){if(key==="graaly.academy.arena.v1"){if(failure==="denied")throw new DOMException("Storage access denied","SecurityError");return "{invalid json";}return getItem.call(this,key);}});},storageFailure);
    const problem=academyProblems[1],arena=await openProblem(page,problem.id,"js");
    await expect(arena.getByLabel("Solution language")).toHaveValue("js");
    await edit(page,problem.solutions.js!);
    await submit(page);
    await expect(arena.locator(".arena-verdict strong")).toHaveText("Accepted",{timeout:30_000});
  });
}

test("an infinite loop times out and Stop leaves the editor usable",async({page},info)=>{
  test.skip(info.project.name!=="desktop","execution recovery is covered once; responsive editing runs in all projects");
  const problem=academyProblems[0],arena=await openProblem(page);
  await edit(page,"export function solve(input) { while (true) {} }");
  await submit(page);
  await expect(arena.locator(".arena-verdict strong")).toHaveText("Time Limit Exceeded",{timeout:30_000});
  await submit(page);
  await arena.getByRole("button",{name:"Stop",exact:true}).click();
  await expect(arena.locator(".arena-verdict strong")).toHaveText("Stopped");
  await edit(page,problem.solutions.ts!);
  await submit(page);
  await expect(arena.locator(".arena-verdict strong")).toHaveText("Accepted",{timeout:30_000});
});

for(const mode of ["plugin","react","python","asgi","fastapi","pydantic","html-css","sql","manifest","c"]){
  test(`${mode}: executes submitted source in its actual local judge`,async({page},info)=>{
    test.skip(info.project.name!=="desktop","full execution matrix is covered on desktop");
    test.setTimeout(180_000);
    const problem=academyProblems.find(problem=>problem.mode===mode)!;
    const language=Object.keys(problem.solutions)[0] as keyof typeof problem.solutions;
    const arena=await openProblem(page,problem.id,language);
    await edit(page,problem.solutions[language]!);
    await submit(page);
    await expect(arena.locator(".arena-verdict strong")).toHaveText("Accepted",{timeout:150_000});
    await expect(arena.locator(".arena-results .is-fail")).toHaveCount(0);
    await expectFits(page);
  });
}

test("the browser HTML compiler matches complete snapshots from the native Java compiler",async({page},info)=>{
  test.skip(info.project.name!=="desktop","parser conformance is covered once");
  const {fixtures}=JSON.parse(await readFile("tests/fixtures/academy-native-html.json","utf8")) as {fixtures:{id:string;source:string;snapshot?:unknown;error?:string}[]};
  const compilation=await build({entryPoints:["app/academy/html-native.ts"],bundle:true,platform:"browser",format:"esm",write:false});
  await page.route("**/academy-compiler-under-test.js",route=>route.fulfill({contentType:"text/javascript",body:compilation.outputFiles[0].text}));
  await openProblem(page);
  const results=await page.evaluate(async fixtures=>{
    const {compileNativeHtml}=await import(/* @vite-ignore */ new URL("./academy-compiler-under-test.js",document.baseURI).href);
    return fixtures.map(fixture=>{try{return{id:fixture.id,snapshot:compileNativeHtml(fixture.source)}}catch{return{id:fixture.id,error:true}}});
  },fixtures);
  expect(results).toEqual(fixtures.map(fixture=>fixture.error?{id:fixture.id,error:true}:{id:fixture.id,snapshot:fixture.snapshot}));
});
