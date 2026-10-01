import { exercise } from "./author.ts";
import type { Json } from "./types.ts";
export function domain(id:string,title:string,track:string,modules:string[],lessons:number[],body:string,cases:[Json,Json][],rules:string[],why:string,hard=false,hints?:string[],cost="O(input size), unless a sort or graph traversal is described below.") {
  return exercise({id,title,track,modules,lessons,hard,tags:[track,...modules],task:title+" under the supplied plugin scenario. Implement solve(input) and return the specified JSON result.",input:"The examples specify the JSON input shape. Preserve input ownership; return only the requested fields.",body,
    examples:cases.slice(0,1),extra:cases.slice(1),rules,
    hints:hints??[rules[0],"Represent the intermediate state by stable identities rather than display text or array positions.",why],why:[why,"The edge tests exercise the rejected and boundary paths as well as successful input. Keep validation ahead of mutation, and construct a deterministic result without changing the caller's data."],cost});
}
