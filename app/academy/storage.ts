import type { ChallengeLanguage, ChallengeMode, ProblemProgress } from "./types.ts";

export const academyStorageKey = "graaly.academy.arena.v1";
export type SavedAcademyState = {version?:number;drafts:Record<string,string>;progress:Record<string,ProblemProgress>;selected:string;language:ChallengeLanguage};

/** Move old framework drafts to their new explicit profile, preserving conflicts. */
export function migrateAcademyState(state:SavedAcademyState,problems:readonly {id:string;mode:ChallengeMode}[]):SavedAcademyState {
  if(state.version===2)return state;
  const drafts={...state.drafts};let language=state.language;
  for(const problem of problems){
    const choices:Partial<Record<ChallengeLanguage,ChallengeLanguage>>=problem.mode==="react"?{ts:"react-ts",js:"react-js"}:problem.mode==="plugin"?{ts:"plugin-ts",js:"plugin-js"}:problem.mode==="fastapi"?{py:"fastapi"}:problem.mode==="asgi"?{py:"asgi"}:{};
    for(const [before,after]of Object.entries(choices)){
      const oldKey=problem.id+":"+before,newKey=problem.id+":"+after;
      if(drafts[oldKey]!==undefined){
        if(drafts[newKey]===undefined)drafts[newKey]=drafts[oldKey];
        else if(drafts[newKey]!==drafts[oldKey])drafts[problem.id+":legacy-"+before]=drafts[oldKey];
        delete drafts[oldKey];
      }
      if(problem.id===state.selected&&language===before)language=after!;
    }
  }
  return {...state,version:2,drafts,language};
}

/** Catch both access denial and write/quota failures without dropping in-memory drafts. */
export function writeAcademyState(serialized:string,getStorage:()=>Pick<Storage,"setItem">=()=>localStorage):boolean {
  try { getStorage().setItem(academyStorageKey,serialized);return true; }
  catch { return false; }
}
