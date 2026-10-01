import type { Json } from "./types.ts";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic visitor operands are checked by the JSON execution boundary.
type Value = any;
export const truth=(x:Value)=>Array.isArray(x)?x.length>0:x&&typeof x==="object"?Object.keys(x).length>0:!!x;
export function get(x:Value,key:Value,fallback:Value=null):Value {if(Array.isArray(x)||typeof x==="string"){if(key==="length")return x.length;if(typeof key!=="number")return fallback;const index=key<0?x.length+key:key;return x[index]??fallback;}return x&&Object.hasOwn(x,String(key))?x[String(key)]:fallback;}
export const clone=(x:Value)=>structuredClone(x);
export const object=(pairs:Value[][])=>Object.fromEntries(pairs);
export const keys=(x:Value)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.keys(x):[];
export const len=(x:Value)=>typeof x==="string"||Array.isArray(x)?x.length:keys(x).length;
export const set=(x:Value,key:Value,value:Value)=>{x[Array.isArray(x)&&key<0?x.length+key:key]=value;return null;};
export const append=(x:Value[],v:Value)=>{x.push(v);return null;};
export const pop=(x:Value[],index=-1)=>x.splice(index<0?x.length+index:index,1)[0]??null;
export const remove=(x:Value[],v:Value)=>{const index=x.findIndex(item=>equal(item,v));if(index>=0)x.splice(index,1);return null;};
export const delete_key=(x:Value,key:string)=>{delete x[key];return null;};
const equal=(a:Value,b:Value):boolean=>!!(a===b||(a&&b&&typeof a==="object"&&typeof b==="object"&&(Array.isArray(a)===Array.isArray(b))&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(key=>Object.hasOwn(b,key)&&equal(a[key],b[key]))));
export const eq=equal,ne=(a:Value,b:Value)=>!equal(a,b),lt=(a:Value,b:Value)=>a<b,le=(a:Value,b:Value)=>a<=b,gt=(a:Value,b:Value)=>a>b,ge=(a:Value,b:Value)=>a>=b;
const contains=(a:Value,b:Value)=>typeof b==="string"?b.includes(a):Array.isArray(b)?b.some(v=>equal(v,a)):b&&Object.hasOwn(b,String(a));
export {contains as in};
export const not_in=(a:Value,b:Value)=>!contains(a,b);
export const add=(a:Value,b:Value)=>Array.isArray(a)?a.concat(b):a+b,sub=(a:Value,b:Value)=>a-b,mul=(a:Value,b:Value)=>a*b,div=(a:Value,b:Value)=>a/b,idiv=(a:Value,b:Value)=>Math.floor(a/b),mod=(a:Value,b:Value)=>((a%b)+b)%b,pow=(a:Value,b:Value)=>a**b;
const bits=(a:Value)=>BigInt(Math.trunc(a));
export const band=(a:Value,b:Value)=>Number(bits(a)&bits(b)),bor=(a:Value,b:Value)=>Number(bits(a)|bits(b)),bxor=(a:Value,b:Value)=>Number(bits(a)^bits(b)),shl=(a:Value,b:Value)=>Number(bits(a)<<bits(b)),shr=(a:Value,b:Value)=>Number(bits(a)>>bits(b)),invert=(a:Value)=>Number(~bits(a));
export const neg=(a:Value)=>-a;
const logicalNot=(a:Value)=>!truth(a);export {logicalNot as not};
export const floor=Math.floor,ceil=Math.ceil,min=Math.min,max=Math.max,abs=Math.abs,float=Number,int=(x:Value)=>Math.trunc(Number(x)),bool=truth,str=(x:Value)=>x===null?"None":x===true?"True":x===false?"False":String(x);
export const sum=(x:Value[])=>x.reduce((a,b)=>a+b,0),round=(x:number,digits=0)=>Number(x.toFixed(digits));
export function range(start:number,end?:number,step=1){if(end===undefined){end=start;start=0;}if(step===0)throw Error("range step must be nonzero");const out:number[]=[];for(let i=start;step>0?i<end:i>end;i+=step){if(out.length>1000000)throw Error("range exceeds the exercise resource limit");out.push(i);}return out;}
export const list=(x:Value=[])=>typeof x==="string"?Array.from(x):Array.isArray(x)?[...x]:keys(x);
export const reversed=(x:Value)=>list(x).reverse();
export const unique=(x:Value[])=>x.filter((v,i)=>x.findIndex(item=>equal(item,v))===i);
export function sort_fields(values:Value[],fields?:string[]){const result=clone(values);if(!fields?.length)return result.sort((a:Value,b:Value)=>a<b?-1:a>b?1:0);for(const field of [...fields].reverse()){const [name,direction]=field.split(":");result.sort((a:Value,b:Value)=>{const x=get(a,/^\d+$/.test(name)?Number(name):name),y=get(b,/^\d+$/.test(name)?Number(name):name);return (x<y?-1:x>y?1:0)*(direction==="desc"?-1:1);});}return result;}
export function slice(value:Value,start:number|null=null,end:number|null=null,step=1){const n=value.length;let first=start===null?(step>0?0:n-1):start<0?Math.max(0,n+start):Math.min(n,start);const last=end===null?(step>0?n:-1):end<0?Math.max(step>0?0:-1,n+end):Math.min(n,end);const out=[];for(;step>0?first<last:first>last;first+=step)out.push(value[first]);return typeof value==="string"?out.join(""):out;}
export const strip=(x:string)=>x.trim(),lower=(x:string)=>x.toLowerCase(),upper=(x:string)=>x.toUpperCase(),startswith=(x:string,prefix:string)=>x.startsWith(prefix),endswith=(x:string,suffix:string)=>x.endsWith(suffix),replace=(x:string,a:string,b:string)=>x.split(a).join(b),split=(x:string,separator?:string)=>separator===undefined?x.trim().split(/\s+/).filter(Boolean):x.split(separator),join=(separator:string,values:string[])=>values.join(separator),index=(x:Value,v:Value)=>typeof x==="string"?x.indexOf(v):x.findIndex((item:Value)=>equal(item,v));
export const is_number=(x:Value)=>typeof x==="number"&&Number.isFinite(x),is_integer=(x:Value)=>typeof x==="number"&&Number.isInteger(x),is_string=(x:Value)=>typeof x==="string",regex=(pattern:string,x:string)=>new RegExp(pattern).test(x),json_text=(x:Value)=>JSON.stringify(x),json_parse=(x:string)=>JSON.parse(x);
export const is_list=Array.isArray,is_object=(x:Value)=>x!==null&&typeof x==="object"&&!Array.isArray(x),uri_component=(x:Value)=>encodeURIComponent(String(x));
export const byte_length=(value:string)=>new TextEncoder().encode(value).length;
export const query_params=(url:string)=>Object.fromEntries(new URL(url,"http://academy.local").searchParams),url_path=(url:string)=>new URL(url,"http://academy.local").pathname;
const word=(value:Value)=>typeof value==="string"?BigInt(value):BigInt(Math.trunc(value));
export function bits_count(value:Value){let bits=BigInt.asUintN(64,word(value)),count=0;while(bits){bits&=bits-1n;count++;}return count;}
export const bits_op=(operation:string,a:Value,b:Value)=>"0x"+BigInt.asUintN(64,operation==="or"?word(a)|word(b):operation==="and"?word(a)&word(b):word(a)&~word(b)).toString(16);
export const bits_shift=(value:Value,shift:number)=>shift>=64?0:Number(BigInt.asUintN(64,word(value)<<BigInt(shift)));
export const bits_extract=(value:Value,offset:number,width:number)=>!width||offset>=64||width>64-offset?0:Number((word(value)>>BigInt(offset))&((1n<<BigInt(width))-1n));
export const rotate32=(value:number,count:number)=>{const shift=BigInt(count%32),bits=word(value);return shift===0n?value:Number(BigInt.asUintN(32,(bits<<shift)|(bits>>(32n-shift))));};
export function float_bits(value:Value){const bytes=new ArrayBuffer(4),view=new DataView(bytes);view.setFloat32(0,Number(value),true);return view.getUint32(0,true);}
export function frozen_probe(data:Value,defaults:Value,field:string,value:Value,listField:string){const first=Object.freeze({...clone(defaults),...clone(data)}),second=Object.freeze({...clone(defaults),...clone(data)});const expected=clone(second[listField]);const frozen=!Reflect.set(first,field,value);first[listField].push("probe");return {frozen,independent_defaults:equal(second[listField],expected)};}
export const epoch=(x:string)=>Date.parse(x)/1000;
export function decimal_total(items:{price:string;quantity:number}[]){let cents=0n;for(const item of items){const [whole,fraction=""]=item.price.split(".");const negative=whole.startsWith("-");const raw=BigInt(whole)*100n+(negative?-1n:1n)*BigInt((fraction+"00").slice(0,2));cents+=raw*BigInt(item.quantity);}const sign=cents<0n?"-":"",v=cents<0n?-cents:cents;return sign+(v/100n)+"."+String(v%100n).padStart(2,"0");}
export function select_paths(value:Value,paths:string[]){const result:Record<string,Json>={};for(const path of paths){const parts=path.split(".");let current=value;while(parts.length){let count=Array.isArray(current)?1:parts.length;while(count>1&&!Object.hasOwn(current??{},parts.slice(0,count).join(".")))count--;const key=parts.splice(0,count).join(".");current=get(current,Array.isArray(current)&&/^\d+$/.test(key)?Number(key):key);}result[path]=current;}return result;}
type SQLite = {Database:new()=>{run:(sql:string)=>void;prepare:(sql:string)=>{bind:(values:Record<string,Json>)=>void;step:()=>boolean;getAsObject:()=>Json;free:()=>void};close:()=>void}};
let sqlite:SQLite|undefined;
export async function initPortableSql(base:string,wasmBinary?:Uint8Array){if(sqlite)return;const sqlModule=await import(/* @vite-ignore */base+"runtime/sql/sql-wasm.mjs");sqlite=await sqlModule.default({locateFile:(file:string)=>base+"runtime/sql/"+file,wasmBinary});}
export function sql_rows(fixture:Record<string,Value>,schema:string,query:string){if(!sqlite)throw Error("SQLite runtime has not been loaded.");const db=new sqlite.Database();try{db.run("PRAGMA foreign_keys=ON;");db.run(schema);db.run(fixture.setup??"");let rows:Json[]=[];for(const sql of query.split(";").filter(x=>x.trim())){const statement=db.prepare(sql);try{statement.bind(Object.fromEntries(Object.entries(fixture.params??{}).map(([k,v])=>[":"+k,v as Json])));const values:Json[]=[];while(statement.step())values.push(statement.getAsObject());if(/^(SELECT|WITH|PRAGMA)\b/i.test(sql.trim())||/\bRETURNING\b/i.test(sql))rows=values;}finally{statement.free();}}if(fixture.inspect){rows=[];const statement=db.prepare(fixture.inspect);try{while(statement.step())rows.push(statement.getAsObject());}finally{statement.free();}}return rows;}finally{db.close();}}
