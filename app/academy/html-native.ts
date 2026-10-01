import type { Json } from "./types.ts";

// Browser port of GraalyHtmlUiCompiler's documented native subset. Conformance
// fixtures are checked against the Java compiler; this is not a web DOM renderer.
type Style = Record<string, string>;
type Area = { column: number; row: number; width: number; height: number };
type Item = { slot: number; material: string; amount: number; durability: number; name: string; lore: string[]; actionId?: string; input?: Record<string, string> };
const containers = new Set("div main section article header footer nav form aside".split(" "));
const permitted = new Set([...containers, ..."span p label strong b em i small h1 h2 h3 h4 h5 h6 input hr br button dialog".split(" ")]);
const inherited = new Set("color font-weight font-style text-decoration text-transform".split(" "));
const dyeNames = ["white", "orange", "magenta", "lightblue", "yellow", "lime", "pink", "gray", "lightgray", "cyan", "purple", "blue", "brown", "green", "red", "black"];
const dyeRgb = [0xf9fffe,0xf9801d,0xc74ebd,0x3ab3da,0xfed83d,0x80c71f,0xf38baa,0x474f52,0x9d9d97,0x169c9c,0x8932b8,0x3c44aa,0x835432,0x5e7c16,0xb02e26,0x1d1d21];
const colors = "f6dbead8735962c0";
const dyeMaterial=(color:number)=>["WHITE","ORANGE","MAGENTA","LIGHT_BLUE","YELLOW","LIME","PINK","GRAY","LIGHT_GRAY","CYAN","PURPLE","BLUE","BROWN","GREEN","RED","BLACK"][color]+"_STAINED_GLASS_PANE";
const blank = (...values: (string | null | undefined)[]) => values.find(value => value?.trim()) ?? "";
const strip = (value: string) => value.replace(/^(['"])([\s\S]*)\1$/, "$2");
const integer = (value: string, fallback = 0) => { const match = value.match(/-?\d+/); return match ? Number(match[0]) : fallback; };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const positive=(value:string)=>Number(value.match(/-?\d+(?:\.\d+)?/)?.[0]??0)>0;
const nodeText=(node:Element):string=>[...node.childNodes].filter(child=>child.nodeType===3).map(child=>child.textContent).join("")+[...node.children].map(child=>" "+nodeText(child)).join("");
function split(value: string, separator: string) {
  const result: string[] = []; let start = 0, depth = 0, quote = "";
  for (let index = 0; index < value.length; index++) {
    const ch = value[index];
    if (quote) { if (ch === quote && value[index - 1] !== "\\") quote = ""; }
    else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === separator && depth === 0) { result.push(value.slice(start, index)); start = index + 1; }
  }
  return [...result, value.slice(start)];
}
function declarations(value: string): Style {
  return Object.fromEntries(split(value, ";").flatMap(part => { const colon = part.indexOf(":"); return colon > 0 ? [[part.slice(0, colon).trim().toLowerCase(), part.slice(colon + 1).trim()]] : []; }));
}
function dye(value: string): number | null {
  const selected = strip(value).trim().toLowerCase();
  if (!selected || selected.includes("transparent") || selected === "none") return null;
  const aliases: Record<string,string> = { snow:"white", fuchsia:"magenta", "light-blue":"lightblue", grey:"gray", darkgray:"gray", darkgrey:"gray", lightgrey:"lightgray", "light-gray":"lightgray", silver:"lightgray", aqua:"cyan", teal:"cyan", violet:"purple", navy:"blue", darkgreen:"green", maroon:"red" };
  const hex = selected.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/);
  const rgb = selected.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (hex || rgb) {
    const number = hex ? parseInt(hex[1].length === 3 ? [...hex[1]].map(ch => ch + ch).join("") : hex[1],16) : (clamp(+rgb![1],0,255)<<16)|(clamp(+rgb![2],0,255)<<8)|clamp(+rgb![3],0,255);
    const distance = (candidate: number) => [16,8,0].reduce((sum, shift) => sum + (((candidate>>shift)&255)-((number>>shift)&255)) ** 2, 0);
    return dyeRgb.reduce((best, color, index) => distance(color) < distance(dyeRgb[best]) ? index : best,0);
  }
  for (const token of selected.split(/[^a-z_-]+/)) { const index = dyeNames.indexOf(aliases[token] ?? token); if (index >= 0) return index; }
  return null;
}
function text(value: string, style: Style): string {
  let selected = value.trim().replace(/\s+/g," ");
  if (style["text-transform"] === "uppercase") selected = selected.toUpperCase();
  if (style["text-transform"] === "lowercase") selected = selected.toLowerCase();
  const color = dye(style.color ?? "");
  return (color == null ? "" : "&" + colors[color]) + (style["font-weight"]==="bold"||integer(style["font-weight"]??"")>=600 ? "&l" : "") + (style["font-style"] === "italic" ? "&o" : "") + ((style["text-decoration"] ?? "").includes("underline") ? "&n" : "") + ((style["text-decoration"] ?? "").includes("line-through") ? "&m" : "") + selected;
}
function javaHash(value: string): string { let hash = 0; for (let index=0;index<value.length;index++) hash=(hash*31+value.charCodeAt(index))|0; return (hash>>>0).toString(16); }
export function compileNativeHtml(source: string): Record<string, unknown> {
  if (source.length > 256000) throw new Error("HTML GUI source exceeds 256000 characters");
  const forbidden = source.match(/<\s*(script|iframe|object|embed|link|meta|img|audio|video|canvas|svg)\b/i);
  if (forbidden) throw new Error(`HTML GUI does not support <${forbidden[1].toLowerCase()}>`);
  if (/<[^>]+\son[a-z][a-z0-9_-]*\s*=/i.test(source)) throw new Error("Inline HTML event attributes are not supported; use data-action");
  const css: string[] = [];
  const html = source.replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_match, value) => { css.push(value); return ""; });
  const document = new DOMParser().parseFromString(html, "text/html");
  let root: Element;
  const synthetic=document.body.children.length!==1;
  if (!synthetic) root = document.body.children[0];
  else { root = document.createElement("div"); root.id = "graaly-html-root"; root.append(...document.body.childNodes); document.body.append(root); }
  const rules: { selector: string; values: Style; order: number; score: number }[] = [];
  for (const match of css.join("\n").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)}/g)) for (const selector of split(match[1],",")) {
    if (selector.trim().startsWith("@")) continue;
    const score=[...selector.matchAll(/([#.])?([A-Za-z_][A-Za-z0-9_-]*|\*)/g)].reduce((sum,match)=>sum+(match[1]==="#"?100:match[1]==="."?10:match[2]!=="*"&&match[2]!=="root"?1:0),0);
    rules.push({ selector: selector.trim(), values: declarations(match[2]), order: rules.length, score });
  }
  function matches(node:Element,selector:string):boolean {
    const parts=selector.trim().replaceAll(">"," > ").replace(/\s+/g," ").split(" ");
    const simple=(node:Element|null,value:string)=>{if(!node)return false;if(value===":root")return synthetic&&node===root;value=value.split(":")[0];if(!value)return true;if(!/^(?:[.#]?[A-Za-z_][A-Za-z0-9_-]*|\*)+$/.test(value))return false;return node.matches(value);};
    let index=parts.length-1,current:Element|null=node;if(!simple(current,parts[index--]))return false;
    while(index>=0){let token=parts[index--];const direct=token===">";if(direct){if(index<0)return false;token=parts[index--];}current=current?.parentElement??null;if(direct){if(!simple(current,token))return false;}else{while(current&&!simple(current,token))current=current.parentElement;if(!current)return false;}}
    return true;
  }
  const styles = new Map<Element,Style>();
  function compute(node: Element, parent: Style) {
    if (!permitted.has(node.tagName.toLowerCase())) throw new Error(`HTML GUI does not support <${node.tagName.toLowerCase()}>`);
    const chosen = new Map<string,{value:string;score:number;order:number}>();
    for (const [key,value] of Object.entries(parent)) if (inherited.has(key) || key.startsWith("--")) chosen.set(key,{value,score:-1,order:-1});
    for (const rule of rules) if (matches(node,rule.selector)) for (const [key,value] of Object.entries(rule.values)) {
      const old = chosen.get(key); if (!old || rule.score > old.score || (rule.score === old.score && rule.order >= old.order)) chosen.set(key,{value,score:rule.score,order:rule.order});
    }
    for (const [key,value] of Object.entries(declarations(node.getAttribute("style") ?? ""))) chosen.set(key,{value,score:1000,order:Infinity});
    const style: Style = {};
    for (const [key,{value}] of chosen) { let resolved = value; for(let pass=0;pass<8;pass++) { const next=resolved.replace(/var\(([^,)]+)(?:,([^)]*))?\)/,(_match,name,fallback)=>chosen.get(name.trim())?.value ?? fallback?.trim() ?? ""); if(next===resolved)break;resolved=next;} style[key]=resolved; }
    styles.set(node,style); for(const child of node.children)compute(child,style);
  }
  compute(root,{});
  const style = (node: Element) => styles.get(node)!;
  const attr = (node: Element, key: string) => node.getAttribute(key) ?? "";
  const attributeRows=integer(blank(attr(root,"data-rows"),attr(root,"rows")),-1);
  const rows=clamp(attributeRows>0?attributeRows:integer(style(root)["grid-template-rows"]?.match(/repeat\(\s*(\d+)\s*,/i)?.[1]??"",3),1,6);
  const cells = new Map<number,Item>(), content = new Set<number>();
  function slot(column:number,row:number) { if(column<0||column>=9||row<0||row>=rows)throw new Error(`CSS grid position is outside the 9x${rows} Minecraft inventory`);return row*9+column; }
  function range(value:string,max:number):[number,number]|null { if(!value||value.trim()==="auto")return null;const parts=split(value,"/");const line=(value:string,fallback:number)=>{const n=integer(value,fallback);return n<0?max+1+n:n;};let start=line(parts[0],1);let end=parts.length<2?start+1:parts[1].trim().startsWith("span ")?start+integer(parts[1].slice(parts[1].indexOf("span")+4),1):line(parts[1],start+1);start=clamp(start,1,max)-1;end=clamp(end,start+2,max+1)-1;return[start,Math.max(1,end-start)]; }
  function area(node:Element,parent:Area):Area|null {
    const selected=style(node),parts=split(selected["grid-area"] ?? "","/");
    const r=range(parts.length===4?parts[0]+"/"+parts[2]:blank(selected["grid-row"],selected["grid-row-start"]?selected["grid-row-start"]+"/"+(selected["grid-row-end"]??"span 1"):""),parent.height);
    const c=range(parts.length===4?parts[1]+"/"+parts[3]:blank(selected["grid-column"],selected["grid-column-start"]?selected["grid-column-start"]+"/"+(selected["grid-column-end"]??"span 1"):""),parent.width);
    if(!r&&!c)return null;const [column,width]=c??[0,1],[row,height]=r??[0,1];return{column:parent.column+column,row:parent.row+row,width:Math.min(width,parent.width-column),height:Math.min(height,parent.height-row)};
  }
  const lore=(node:Element)=>{const raw=blank(attr(node,"data-lore"),style(node)["--minecraft-lore"]);return raw?strip(raw).replaceAll("\\n","\n").split(/[|\n]/).map(value=>text(value,style(node))):[];};
  const decorative=(slot:number,color:number):Item=>({slot,material:dyeMaterial(color),amount:1,durability:color,name:" ",lore:[]});
  function panel(node:Element,area:Area) {
    const selected=style(node),background=dye(blank(selected["background-color"],selected.background)),border=dye(blank(selected["border-color"],selected.border));
    const side=(name:string)=>{const value=blank(selected[`border-${name}-color`],selected[`border-${name}`]);return !value?border:value.startsWith("0")||value.includes("none")?null:dye(value)??border;};
    const [top,right,bottom,left]=["top","right","bottom","left"].map(side);
    for(let row=0;row<area.height;row++)for(let column=0;column<area.width;column++){
      const id=slot(area.column+column,area.row+row);
      if(positive(selected["border-radius"]??"")&&(row===0||row===area.height-1)&&(column===0||column===area.width-1)&&area.width>2&&area.height>2){cells.delete(id);continue;}
      const color=row===0&&top!=null?top:row===area.height-1&&bottom!=null?bottom:column===0&&left!=null?left:column===area.width-1&&right!=null?right:background;
      if(color!=null)cells.set(id,decorative(id,color));
    }
  }
  function leaf(node:Element,area:Area) {
    const selected=style(node),tag=node.tagName.toLowerCase(),color=dye(blank(selected["background-color"],selected.background))??(tag==="hr"?8:null);
    const material=strip(blank(attr(node,"data-material"),selected["--minecraft-material"],color!=null?dyeMaterial(color):tag==="input"?"NAME_TAG":tag==="button"?"STONE_BUTTON":"PAPER")).toUpperCase();
    const action=blank(attr(node,"data-action"),tag==="button"||tag==="input"?attr(node,"id"):"");
    const named=area.row*9+area.column+Math.floor((area.height-1)/2)*9+Math.floor((area.width-1)/2);
    for(let row=0;row<area.height;row++)for(let column=0;column<area.width;column++){
      const id=slot(area.column+column,area.row+row);
      const item:Item={slot:id,material,amount:clamp(integer(blank(attr(node,"data-amount"),selected["--minecraft-amount"]),1),1,64),durability:integer(blank(attr(node,"data-durability"),selected["--minecraft-durability"]),color??0),name:id===named?text(blank(attr(node,"aria-label"),attr(node,"title"),tag==="input"?attr(node,"placeholder"):"",nodeText(node)," "),selected):" ",lore:lore(node),...(action?{actionId:action}:{})};
      if(tag==="input")item.input={id:blank(attr(node,"id"),"input-"+id),title:blank(attr(node,"aria-label"),attr(node,"title"),attr(node,"placeholder"),"Enter text"),placeholder:blank(attr(node,"placeholder"),"Enter text"),value:attr(node,"value"),submitActionId:action,cancelActionId:attr(node,"data-cancel-action")};
      cells.set(id,item);content.add(id);
    }
  }
  function cursor(area:Area){let offset=0;return(row=false):Area|null=>{if(row){const y=Math.min(area.height-1,Math.floor(offset/Math.max(1,area.width)));offset=Math.min(area.width*area.height,(y+1)*area.width);for(let x=0;x<area.width;x++)content.add(slot(area.column+x,area.row+y));return{column:area.column,row:area.row+y,width:area.width,height:1};}while(offset<area.width*area.height){const x=offset%area.width,y=Math.floor(offset/area.width);offset++;const id=slot(area.column+x,area.row+y);if(!content.has(id)){content.add(id);return{column:area.column+x,row:area.row+y,width:1,height:1};}}return null;};}
  function render(node:Element,parent:Area,next:ReturnType<typeof cursor>){const selected=style(node),tag=node.tagName.toLowerCase();if(tag==="dialog"||selected.display==="none")return;const explicit=area(node,parent),isContainer=containers.has(tag),position=explicit??(isContainer?parent:next(tag==="hr"));if(!position)return;if(isContainer){if(explicit||Object.keys(selected).some(key=>key.startsWith("background")||key.startsWith("border")))panel(node,position);if(!node.children.length&&nodeText(node).trim())leaf(node,position);else{const childNext=cursor(position);for(const child of node.children)render(child,position,childNext);}}else if(tag!=="br")leaf(node,position);}
  const canvas={column:0,row:0,width:9,height:rows};
  const snapshot:Record<string,unknown>={messages:[]};
  if(root.tagName.toLowerCase()!=="dialog"){
    if(containers.has(root.tagName.toLowerCase())){panel(root,canvas);const next=cursor(canvas);for(const child of root.children)render(child,canvas,next);if(!root.children.length&&nodeText(root).trim())leaf(root,canvas);}else render(root,canvas,cursor(canvas));
    snapshot.inventory={id:blank(attr(root,"id"),"html:"+javaHash(source)),title:blank(attr(root,"aria-label"),attr(root,"data-title"),attr(root,"title"),"Graaly"),rows,...(attr(root,"data-close-action")?{closeActionId:attr(root,"data-close-action")} :{}),items:[...cells.values()]};
  }
  const dialog=root.tagName.toLowerCase()==="dialog"&&root.hasAttribute("open")?root:root.querySelector("dialog[open]");
  if(dialog){const buttons=[...dialog.querySelectorAll("button")];if(buttons.length!==2)throw new Error("An HTML <dialog> must contain exactly two <button> choices");snapshot.modal={id:blank(attr(dialog,"id"),"dialog:"+javaHash(nodeText(dialog))),title:blank(attr(dialog,"aria-label"),attr(dialog,"data-title"),attr(dialog,"title"),"Are you sure?"),closeActionId:attr(dialog,"data-close-action"),choices:buttons.map((button,index)=>{const selected=style(button),color=dye(blank(selected["background-color"],selected.background))??(index===0?5:14),action=blank(attr(button,"data-action"),attr(button,"id"));if(!action)throw new Error("Each <dialog> button needs id or data-action");return{slot:index,material:strip(blank(attr(button,"data-material"),selected["--minecraft-material"],dyeMaterial(color))).toUpperCase(),amount:1,durability:integer(blank(attr(button,"data-durability"),selected["--minecraft-durability"]),color),name:text(blank(attr(button,"aria-label"),nodeText(button),index===0?"Yes":"No"),selected),lore:lore(button),actionId:action};})};}
  return snapshot;
}
export function projectHtml(snapshot:Record<string,unknown>,paths:string[]):Json {
  const slots=Object.fromEntries(((snapshot.inventory as {items?:Item[]})?.items??[]).map(item=>[String(item.slot),item]));
  const data={...snapshot,slots};
  return Object.fromEntries(paths.map(path=>[path,path.split(".").reduce<unknown>((value,key)=>value==null?null:(value as Record<string,unknown>)[key]??null,data)])) as Json;
}
