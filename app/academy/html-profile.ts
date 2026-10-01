import {compileNativeHtml} from "./html-native.ts";
import type {Json} from "./types.ts";

export function parseHtmlProfile(source:string):{script:string;markup:string}{
  const document=new DOMParser().parseFromString(source,"text/html");
  const scripts=Array.from(document.querySelectorAll("script"));
  if(scripts.length!==1||!scripts[0].hasAttribute("data-academy-solution")||scripts[0].getAttribute("type")!=="module")throw Error("Use exactly one <script type=module data-academy-solution> for solve(input).");
  const script=scripts[0].textContent??"";scripts[0].remove();
  const markup=document.head.innerHTML+document.body.innerHTML;
  if(!markup.includes("{{result}}"))throw Error("Keep {{result}} in the native item that displays the result.");
  return {script,markup};
}
export function resultMarkup(markup:string,result:Json):string{
  // Native labels collapse whitespace. JSON escapes preserve spaces inside data
  // while also keeping markup-significant characters out of the fragment.
  const escaped=JSON.stringify(result).replace(/[&<>\s]/gu,char=>"\\u"+char.codePointAt(0)!.toString(16).padStart(4,"0"));
  return markup.replaceAll("{{result}}",escaped);
}
export function renderHtmlResult(markup:string,result:Json):{actual:Json;snapshot:Record<string,unknown>}{
  const snapshot=compileNativeHtml(resultMarkup(markup,result));
  const inventory=snapshot.inventory as {items:{actionId?:string;name:string}[]}|undefined;
  const labels=(inventory?.items??[]).filter(item=>item.actionId==="academy.result").map(item=>item.name.replace(/^(?:&[0-9a-fklmnor])+/i,"")).filter(name=>name.trim());
  if(labels.length!==1)throw Error("Render one nonempty native result item with data-action=academy.result.");
  return {actual:JSON.parse(labels[0]) as Json,snapshot};
}
