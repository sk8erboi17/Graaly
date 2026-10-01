"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Code2, Play, Search, Square, RotateCcw, Lightbulb, BookOpen, Copy, Download } from "lucide-react";
import { academyProblems, problemTracks, coveredModules } from "./catalog.ts";
import { AcademyEditor } from "./editor.tsx";
import { startJudge } from "./client-judge.ts";
import { challengeLanguages, type ChallengeLanguage, type JudgeResult, type ProblemProgress } from "./types.ts";
import { compileNativeHtml } from "./html-native.ts";
import { academyStorageKey as storageKey, writeAcademyState, migrateAcademyState, type SavedAcademyState } from "./storage.ts";
import {parseHtmlProfile,renderHtmlResult} from "./html-profile.ts";
import {resolveVariant} from "./variants.ts";

const fresh=():ProblemProgress=>({attempts:0,solved:false,assisted:false,revealed:false,hints:0});
type Saved=SavedAcademyState;
export type PracticeRequest={id:string;language:ChallengeLanguage;revision:number};
const stringify=(value:unknown)=>JSON.stringify(value,null,2);
function NativePreview({snapshot}:{snapshot:Record<string,unknown>}) {
  const inventory=snapshot.inventory as {title:string;rows:number;items:{slot:number;name:string;material:string;amount:number;durability:number}[]}|undefined;
  const modal=snapshot.modal as {title:string;choices:{name:string}[]}|undefined;
  if(!inventory)return <div className="arena-native">{modal?<><strong>{modal.title}</strong>{modal.choices.map((choice,index)=><span key={index}>{choice.name.replace(/&[0-9a-fklmnor]/gi,"")}</span>)}</>:"No inventory surface."}</div>;
  return <div className="arena-native"><strong>{inventory.title}</strong><div className="arena-inventory">{Array.from({length:inventory.rows*9},(_,slot)=>{const item=inventory.items.find(item=>item.slot===slot);return <div className={item?"has-item":""} key={slot} title={item?`${slot}: ${item.name.replace(/&[0-9a-fklmnor]/gi,"")} · ${item.material}`:`Slot ${slot}`}><small>{slot}</small>{item&&<><b>{item.material.endsWith("STAINED_GLASS_PANE")?"▪":item.material==="DIAMOND"?"◆":item.material==="EMERALD"?"✦":item.material==="BOOK"?"▤":item.material==="NAME_TAG"?"▰":"■"}</b>{item.amount>1&&<em>{item.amount}</em>}</>}</div>;})}</div><span>Native Minecraft inventory · 9 columns · hover a slot to inspect</span></div>;
}
export function GraalyArena({onLesson,requestedPractice}:{onLesson:(number:number)=>void;requestedPractice?:PracticeRequest}) {
  const [selected,setSelected]=useState(academyProblems[0].id),[language,setLanguage]=useState<ChallengeLanguage>("ts");
  const [drafts,setDrafts]=useState<Record<string,string>>({}),[progress,setProgress]=useState<Record<string,ProblemProgress>>({}),[loaded,setLoaded]=useState(false);
  const [persisted,setPersisted]=useState<string|null>(null),[saveUnavailable,setSaveUnavailable]=useState(false);
  const [search,setSearch]=useState(""),[track,setTrack]=useState("All tracks"),[difficulty,setDifficulty]=useState("All difficulties"),[status,setStatus]=useState("All statuses");
  const [tab,setTab]=useState("Description"),[result,setResult]=useState<JudgeResult|null>(null),[running,setRunning]=useState(false),[message,setMessage]=useState("");
  const [submittedAll,setSubmittedAll]=useState(false);
  const [preview,setPreview]=useState<Record<string,unknown>|null>(null),[copied,setCopied]=useState(false);
  const stop=useRef<(()=>void)|null>(null);
  const solutionHeading=useRef<HTMLHeadingElement>(null);
  const problem=academyProblems.find(problem=>problem.id===selected)??academyProblems[0];
  const available=challengeLanguages.filter(item=>problem.starters[item.id]!==undefined);
  const lang=available.some(item=>item.id===language)?language:available[0].id;
  const execution=resolveVariant(problem,lang);
  const draftKey=problem.id+":"+lang;
  const code=drafts[draftKey]??problem.starters[lang]??"";
  const snapshot=JSON.stringify({version:2,drafts,progress,selected,language:lang} satisfies Saved);
  const saved=loaded&&!saveUnavailable&&persisted===snapshot;
  const saveLabel=saveUnavailable?"Device storage unavailable. Download your code to keep a copy.":!loaded?"Preparing device storage…":saved?"Drafts and progress saved on this device.":"Saving drafts and progress…";
  const current=progress[problem.id]??fresh();
  const edited=code.trim()!==(problem.starters[lang]??"").trim();
  const accepted=Object.values(progress).filter(item=>item.solved).length;
  const filtered=useMemo(()=>academyProblems.filter(problem=>
    (track==="All tracks"||problem.track===track)&&(difficulty==="All difficulties"||problem.difficulty===difficulty)
    &&(status==="All statuses"||(status==="Solved"?progress[problem.id]?.solved:status==="Attempted"?(progress[problem.id]?.attempts??0)>0&&!progress[problem.id]?.solved:!progress[problem.id]?.solved))
    &&[problem.title,problem.track,...problem.tags,...problem.modules].join(" ").toLowerCase().includes(search.toLowerCase())),[search,track,difficulty,status,progress]);
  /* eslint-disable react-hooks/set-state-in-effect -- Restore external device state after matching SSR hydration. */
  useEffect(()=>{
    // Restore the external device store after hydration; SSR must use the same starter as the first client render.
    const query=new URLSearchParams(location.search);let saved:Saved|null=null;
    try{saved=JSON.parse(localStorage.getItem(storageKey)??"null") as Saved|null;
      if(saved){saved=migrateAcademyState(saved,academyProblems);setDrafts(saved.drafts??{});setProgress(saved.progress??{});setLanguage(saved.language??"ts");}
    }catch{setSaveUnavailable(true);}
    const id=query.get("exercise")??saved?.selected;if(id&&academyProblems.some(problem=>problem.id===id))setSelected(id);
    const requested=query.get("language");if(challengeLanguages.some(item=>item.id===requested))setLanguage(requested as ChallengeLanguage);
    setLoaded(true);
    return()=>{stop.current?.();};
  },[]);
  useEffect(()=>{
    if(!loaded||!requestedPractice)return;
    stop.current?.();stop.current=null;setRunning(false);setSelected(requestedPractice.id);
    setLanguage(requestedPractice.language);setResult(null);setPreview(null);setTab("Description");
    const url=new URL(location.href);url.searchParams.set("exercise",requestedPractice.id);url.searchParams.set("language",requestedPractice.language);url.hash="academy";history.replaceState(null,"",url);
  },[loaded,requestedPractice]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(()=>{if(!loaded)return;const handle=setTimeout(()=>{const success=writeAcademyState(snapshot);setSaveUnavailable(!success);if(success)setPersisted(snapshot);},150);return()=>clearTimeout(handle);},[snapshot,loaded]);
  function choose(id:string) {stop.current?.();stop.current=null;setSelected(id);setResult(null);setPreview(null);setTab("Description");const next=academyProblems.find(problem=>problem.id===id)!;const nextLang=next.starters[lang]!==undefined?lang:challengeLanguages.find(item=>next.starters[item.id]!==undefined)!.id;setLanguage(nextLang);
    const url=new URL(location.href);url.searchParams.set("exercise",id);url.searchParams.set("language",nextLang);url.hash="academy";history.replaceState(null,"",url);
  }
  function updateProgress(update:(value:ProblemProgress)=>ProblemProgress){setProgress(values=>({...values,[problem.id]:update(values[problem.id]??fresh())}));}
  function showSolution(){updateProgress(value=>({...value,revealed:true}));setTab("Editorial");requestAnimationFrame(()=>solutionHeading.current?.focus());}
  function changeLanguage(next:ChallengeLanguage){setLanguage(next);setResult(null);setPreview(null);const url=new URL(location.href);url.searchParams.set("exercise",problem.id);url.searchParams.set("language",next);history.replaceState(null,"",url);}
  function run(all:boolean) {
    if(running||!edited)return;setRunning(true);setResult(null);setSubmittedAll(all);setMessage("Starting local tests…");setTab("Results");
    stop.current=startJudge(execution,code,all,setMessage,value=>{
      setRunning(false);setResult(value);stop.current=null;
      if(all&&value.verdict!=="Stopped")updateProgress(previous=>({...previous,attempts:previous.attempts+1,lastVerdict:value.verdict,solved:previous.solved||value.verdict==="Accepted",assisted:previous.assisted||(value.verdict==="Accepted"&&previous.revealed),acceptedLanguages:value.verdict==="Accepted"?[...new Set([...(previous.acceptedLanguages??[]),lang])]:previous.acceptedLanguages}));
      if(execution.mode==="html-css")try{setPreview(compileNativeHtml(code));}catch{setPreview(null);}
      else if(execution.jsonFunction==="html")try{const actual=value.cases.find(test=>test.actual!==undefined)?.actual;if(actual!==undefined)setPreview(renderHtmlResult(parseHtmlProfile(code).markup,actual).snapshot);}catch{setPreview(null);}
    });
  }
  function download(){const file=challengeLanguages.find(item=>item.id===lang)!;const url=URL.createObjectURL(new Blob([code],{type:"text/plain"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=problem.id+"."+file.extension;anchor.click();URL.revokeObjectURL(url);}
  return <div className="arena" data-testid="graaly-arena">
    <div className="arena-intro"><div><span className="arena-eyebrow">GRAALY ACADEMY · CODE PRACTICE</span><h3>Build it. Run it. Understand it.</h3><p>{academyProblems.length} Medium and Hard problems across {problemTracks.length} tracks. Write your code, run examples, then submit against edge cases. Choose a language or environment for every problem. Hints and explained solutions help when you get stuck.</p><div className="arena-coverage">{problemTracks.map(track=><button key={track} onClick={()=>setTrack(track)} type="button">{track}</button>)}</div></div><div className="arena-progress"><Code2 size={24}/><strong>{accepted}<small> / {academyProblems.length}</small></strong><span>accepted problems</span><progress max={academyProblems.length} value={accepted}/><small>{saveLabel}</small></div></div>
    <details className="arena-runtime-note"><summary>Curriculum and execution environments</summary><p>SDK modules: {coveredModules.join(", ")}. Every problem supports TypeScript, JavaScript, Python, C, React, FastAPI, Pydantic, ASGI, Graaly plugin and HTML/CSS profiles. SQL and YAML provide dedicated query and configuration editors on relevant problems. Equivalent profiles use the same observable JSON contract; the selected framework profile executes its actual framework. TypeScript / JavaScript plugin tests use deterministic SDK adapters; TypeScript is transpiled without semantic type checking. React uses the repository&apos;s production renderer and test transport. Python 3.14, Pydantic 2.12 and FastAPI 0.136 run in Pyodide; SQL runs in SQLite. C17 compiles locally with Clang 22 to WebAssembly. HTML/CSS follows Graaly&apos;s native inventory subset. FastAPI exercises use async endpoints and real ASGI requests; server threads, external services and deployment are covered in the linked lessons and production examples.</p><p>Website boards remain experimental and unavailable: their exercises cover capability checks and protocol state. The API and PacketEvents reference covers the complete generated symbol catalog.</p><a href="#api-reference">Open the complete API reference</a><a href="#packets">Open PacketEvents</a><a download href="./downloads/Graaly-Academy-Plugin.zip">Download the in-game companion</a><a download href="./downloads/Graaly-Academy-Workbook.zip">Download all problems and starter files</a></details>
    <div className="arena-filters"><label className="arena-search"><Search size={15}/><input aria-label="Search problems" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search problems, APIs, concepts…"/></label><select aria-label="Problem track" value={track} onChange={event=>setTrack(event.target.value)}><option>All tracks</option>{problemTracks.map(track=><option key={track}>{track}</option>)}</select><select aria-label="Problem difficulty" value={difficulty} onChange={event=>setDifficulty(event.target.value)}><option>All difficulties</option><option>Medium</option><option>Hard</option></select><select aria-label="Problem status" value={status} onChange={event=>setStatus(event.target.value)}><option>All statuses</option><option>Unsolved</option><option>Attempted</option><option>Solved</option></select></div>
    <div className="arena-shell"><nav className="arena-problems" aria-label="Coding problems"><div className="arena-list-header">{filtered.length} problems <span>{track}</span></div>{filtered.map(item=><button aria-current={item.id===problem.id?"true":undefined} className={item.id===problem.id?"is-selected":""} key={item.id} onClick={()=>choose(item.id)} type="button"><span>{progress[item.id]?.solved?<Check size={14}/>:String(item.number).padStart(3,"0")}</span><div><strong>{item.title}</strong><small>{item.track} · <b className={item.difficulty.toLowerCase()}>{item.difficulty}</b></small></div></button>)}{!filtered.length&&<p>No matching problems. Adjust the filters.</p>}</nav>
    <div className="arena-workspace"><div className="arena-problem-heading"><div><span className={problem.difficulty.toLowerCase()}>{problem.difficulty}</span><span>{problem.track}</span>{current.solved&&<span className="is-accepted">{!current.acceptedLanguages||current.acceptedLanguages.includes(lang)?"Accepted":"Solved in another profile"}{current.assisted?" · assisted":""}</span>}</div><h4>{problem.number}. {problem.title}</h4><div className="arena-tags">{problem.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>
    <div className="arena-panes"><div className="arena-reading"><div className="arena-tabs" role="tablist" aria-label="Problem details">{["Description","Results","Editorial"].map(item=><button aria-selected={tab===item} role="tab" key={item} onClick={()=>setTab(item)} type="button">{item}</button>)}</div>
      {tab==="Description"&&<article className="arena-statement">{problem.description.map(text=><p key={text}>{text}</p>)}<strong>Requirements</strong><ul>{problem.requirements.map(text=><li key={text}>{text}</li>)}</ul><details><summary>Function / execution contract</summary><pre>{execution.inputType}</pre>{execution.note&&<p>{execution.note}</p>}</details>{execution.cDeclarations&&<details><summary>Types supplied by the C test harness</summary><pre>{execution.cDeclarations}</pre></details>}<strong>Examples</strong>{problem.cases.filter(test=>!test.hidden).map((test,index)=><div className="arena-example" key={test.name}><span>Example {index+1} · {test.name}</span><small>Input</small><pre>{stringify(test.input)}</pre><small>Expected output</small><pre>{stringify(test.expected)}</pre></div>)}{problem.lessons.length>0&&<p className="arena-lesson-links"><BookOpen size={14}/>Related theory: {problem.lessons.map(number=><button key={number} onClick={()=>onLesson(number)} type="button">Lesson {number}</button>)}</p>}</article>}
      {tab==="Results"&&<div className="arena-results" aria-live="polite">{running?<div className="arena-running"><span className="arena-spinner"/>{message}</div>:result?<><div className={`arena-verdict ${result.verdict==="Accepted"?"is-accepted":"is-failed"}`}><strong>{result.verdict==="Accepted"&&!submittedAll?"Examples passed":result.verdict}</strong><span>{result.cases.filter(test=>test.passed).length} / {result.cases.length} passed · {(result.durationMs/1000).toFixed(2)}s</span></div>{result.error&&<pre className="arena-error">{result.error}</pre>}{result.cases.map((test,index)=><details className={test.passed?"is-pass":"is-fail"} key={index} open={!test.passed}><summary>{test.passed?"✓":"×"} {test.name}<small>{test.durationMs.toFixed(0)}ms</small></summary><small>Input</small><pre>{stringify(test.input)}</pre><small>Expected</small><pre>{stringify(test.expected)}</pre><small>Actual</small><pre>{test.error??stringify(test.actual)}</pre>{test.logs.length>0&&<><small>Console</small><pre>{test.logs.join("\n")}</pre></>}</details>)}</>:<p>Write your implementation, then Run examples or Submit all tests. Only a successful submission marks the problem accepted.</p>}{preview&&<NativePreview snapshot={preview}/>}</div>}
      {tab==="Editorial"&&<div className="arena-editorial"><Lightbulb size={20}/><h5>Work through the problem</h5><p>Reveal one hint at a time, or show the explained solution in your selected language or environment whenever you need it.</p>{problem.hints.slice(0,current.hints).map((hint,index)=><div className="arena-hint" key={hint}><strong>Hint {index+1}</strong><p>{hint}</p></div>)}<button disabled={current.hints>=problem.hints.length} onClick={()=>updateProgress(value=>({...value,hints:value.hints+1}))} type="button">{current.hints>=problem.hints.length?"All hints revealed":"Reveal next hint"}</button>{!current.revealed?<button onClick={showSolution} type="button">Show solution</button>:<div className="arena-solution"><h5 ref={solutionHeading} tabIndex={-1}>Solution explained</h5><p><strong>Language / environment:</strong> {available.find(item=>item.id===lang)!.label}</p>{execution.note&&<p>{execution.note}</p>}{problem.explanation.map(text=><p key={text}>{text}</p>)}<p><strong>Complexity:</strong> {problem.complexity}</p>{problem.pitfalls.map(text=><p key={text}><strong>Pitfall:</strong> {text}</p>)}<pre aria-label="Reference solution code">{problem.solutions[lang]}</pre><button onClick={()=>{setDrafts(values=>({...values,[draftKey]:problem.solutions[lang]??""}));}} type="button">Load solution into editor</button><p>Submissions after revealing the solution are tracked as assisted.</p></div>}</div>}
    </div><div className="arena-coding"><div className="arena-editor-toolbar"><label>Language / environment<select aria-label="Solution language" value={lang} onChange={event=>{stop.current?.();changeLanguage(event.target.value as ChallengeLanguage);}}>{available.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><div><button aria-label="Copy code" onClick={async()=>{await navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),1500);}} type="button">{copied?<Check size={15}/>:<Copy size={15}/>}</button><button aria-label="Download code" onClick={download} type="button"><Download size={15}/></button><button aria-label="Reset starter" onClick={()=>{stop.current?.();setDrafts(values=>({...values,[draftKey]:problem.starters[lang]??""}));setResult(null);}} type="button"><RotateCcw size={15}/></button></div></div>
    <AcademyEditor key={draftKey} language={lang} value={code} onChange={value=>setDrafts(values=>({...values,[draftKey]:value}))} onRun={()=>run(false)} onSubmit={()=>run(true)}/>
    <div className="arena-run-bar"><span>{running?message:edited?"Ready to test · ⌘/Ctrl Enter":"Start by writing your implementation"}</span><div><button className="arena-show-solution" onClick={showSolution} type="button"><Lightbulb size={13}/>Show solution</button>{running?<button onClick={()=>stop.current?.()} type="button"><Square size={13}/>Stop</button>:<><button disabled={!edited} onClick={()=>run(false)} type="button"><Play size={13}/>Run examples</button><button className="arena-submit" disabled={!edited} onClick={()=>run(true)} type="button">Submit all tests<ChevronRight size={14}/></button></>}</div></div>
    </div></div><div className="arena-bottom"><span>{current.attempts} submissions · {problem.cases.length} test cases · {saveUnavailable?"storage unavailable":saved?"drafts saved locally":"saving drafts…"}</span><button onClick={()=>{const next=academyProblems.find(item=>item.number>problem.number&&!progress[item.id]?.solved)??academyProblems.find(item=>!progress[item.id]?.solved);if(next)choose(next.id);}} type="button">Next unsolved<ChevronRight size={14}/></button></div>
    </div></div>
  </div>;
}
