import { academyProblems } from "../app/academy/catalog.ts";
import { readFile, writeFile, mkdtemp, rm, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

const directory=await mkdtemp(path.join(tmpdir(),"graaly-html-fixtures-"));
const native="runtime/src/main/java/io/github/sk8erboi17/graaly/polyglot/GraalyHtmlUiCompiler.java";
const dependencies=process.env.GRAALY_HTML_FIXTURE_CLASSPATH??[
  path.join(homedir(),".m2/repository/com/google/code/gson/gson/2.14.0/gson-2.14.0.jar"),
  path.join(homedir(),".m2/repository/org/jsoup/jsoup/1.23.1/jsoup-1.23.1.jar")
].join(path.delimiter);
const fixtures=academyProblems.filter(problem=>problem.mode==="html-css").map(problem=>({id:problem.id,source:problem.solutions.html}));
const probes=[
  ["synthetic-root","<span>Hello</span><hr><button id='next'>Next</button>"],
  ["zero-rows","<style>main{grid-template-rows:repeat(2,1fr)}</style><main data-rows='0'><button>Two rows</button></main>"],
  ["fractional-radius","<main data-rows='3' style='background:red;border:1px solid blue;border-radius:0.5px'><button>Inside</button></main>"],
  ["descendant-selectors","<style>main .choice{color:green}main > button{color:red}button[data-action]{color:blue}</style><main><div><button class='choice'>Nested</button></div><button>Direct</button></main>"],
  ["text-order","<button>Before <span>nested</span> after <b>bold</b> end</button>"],
  ["closed-dialog","<dialog><button id='yes'>Yes</button><button id='no'>No</button></dialog>"],
  ["forbidden-script","<main><script>alert(1)</script></main>"],
  ["forbidden-inline-handler","<button onclick='doSomething()'>Click</button>"]
];
fixtures.push(...probes.map(([id,source])=>({id,source})));
try{
  await writeFile(path.join(directory,"input.json"),JSON.stringify(fixtures));
  execFileSync("javac",["-cp",dependencies,"-d",directory,native,"tests/helpers/AcademyHtmlConformance.java"],{stdio:"inherit"});
  execFileSync("java",["-cp",directory+path.delimiter+dependencies,"io.github.sk8erboi17.graaly.polyglot.AcademyHtmlConformance",path.join(directory,"input.json"),path.join(directory,"output.json")],{stdio:"inherit"});
  const result={nativeSha256:createHash("sha256").update(await readFile(native)).digest("hex"),fixtures:JSON.parse(await readFile(path.join(directory,"output.json"),"utf8"))};
  await mkdir("tests/fixtures",{recursive:true});
  await writeFile("tests/fixtures/academy-native-html.json",JSON.stringify(result,null,2)+"\n");
  console.log("Generated "+fixtures.length+" fixtures from the actual Java HTML compiler.");
}finally{await rm(directory,{recursive:true,force:true});}
