import { compileNativeHtml, projectHtml } from "./html-native.ts";
import { jsonEqual, type Challenge, type JudgeResult, type CaseResult } from "./types.ts";
import {parseHtmlProfile,renderHtmlResult} from "./html-profile.ts";

export function startJudge(problem:Challenge,source:string,all:boolean,onProgress:(message:string)=>void,onResult:(result:JudgeResult)=>void):()=>void {
  const started=performance.now();const cases:CaseResult[]=[];let finished=false;
  if(source.length>256000){queueMicrotask(()=>onResult({verdict:"Compile Error",cases,durationMs:performance.now()-started,error:"Source exceeds the 256000-character exercise limit."}));return()=>{};}
  if(problem.jsonFunction==="html"){
    try{
      const {script,markup}=parseHtmlProfile(source);
      renderHtmlResult(markup,null);
      return startJudge({...problem,jsonFunction:undefined},script,all,onProgress,result=>{
        const checked=result.cases.map(test=>{if(test.error||test.actual===undefined)return test;try{const {actual}=renderHtmlResult(markup,test.actual);return {...test,actual,passed:jsonEqual(actual,test.expected)};}catch(error){return {...test,passed:false,error:error instanceof Error?error.message:String(error)};}});
        const verdict=result.verdict==="Accepted"||result.verdict==="Wrong Answer"?checked.some(test=>test.error)?"Runtime Error":checked.every(test=>test.passed)?"Accepted":"Wrong Answer":result.verdict;
        onResult({...result,verdict,cases:checked,durationMs:performance.now()-started});
      });
    }catch(error){queueMicrotask(()=>onResult({verdict:"Compile Error",cases,durationMs:performance.now()-started,error:error instanceof Error?error.message:String(error)}));return()=>{};}
  }
  if(problem.mode==="html-css") {
    const handle=setTimeout(()=>{
      try { const snapshot=compileNativeHtml(source);for(const test of problem.cases.filter(test=>all||!test.hidden)){
        const actual=projectHtml(snapshot,(test.input as {paths:string[]}).paths);cases.push({...test,actual,passed:jsonEqual(actual,test.expected),durationMs:0,logs:[]});
      } onResult({verdict:cases.every(test=>test.passed)?"Accepted":"Wrong Answer",cases,durationMs:performance.now()-started});}
      catch(error){onResult({verdict:"Compile Error",cases,durationMs:performance.now()-started,error:error instanceof Error?error.message:String(error)});}
      finished=true;
    },0);
    return()=>{clearTimeout(handle);if(!finished)onResult({verdict:"Stopped",cases,durationMs:performance.now()-started});};
  }
  const base=new URL("./academy/",document.baseURI).href;
  let worker:Worker;
  try{worker=new Worker(base+"judge-worker.js",{type:"module"});}
  catch(error){queueMicrotask(()=>onResult({verdict:"Runtime Error",cases,durationMs:performance.now()-started,error:error instanceof Error?error.message:"This browser could not start the test worker."}));return()=>{};}
  let timer:ReturnType<typeof setTimeout>;
  const complete=(result:JudgeResult)=>{if(finished)return;finished=true;clearTimeout(timer);worker.terminate();onResult(result);};
  const deadline=(ms:number)=>{clearTimeout(timer);timer=setTimeout(()=>complete({verdict:"Time Limit Exceeded",cases,durationMs:performance.now()-started,error:"The worker exceeded its time limit and was terminated. Your draft is preserved; edit it and try again."}),ms);};
  deadline(problem.mode==="c"?90000:["python","asgi","pydantic","fastapi","sql"].includes(problem.mode)?120000:15000);
  worker.onmessage=event=>{
    const data=event.data;
    if(data.kind==="progress")onProgress(data.text);
    if(data.kind==="ready")deadline(5000);
    if(data.kind==="case"){deadline(5000);onProgress(`Testing ${data.index+1}/${data.total}: ${data.name}`);}
    if(data.kind==="case-result")cases.push(data.result);
    if(data.kind==="result")complete(data.result);
  };
  worker.onerror=event=>complete({verdict:"Runtime Error",cases,durationMs:performance.now()-started,error:event.message||"The test worker could not start."});
  worker.postMessage({problem,source,all,base});
  return()=>complete({verdict:"Stopped",cases,durationMs:performance.now()-started});
}
