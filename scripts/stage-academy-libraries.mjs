import {copyFile,mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const c="public/academy/runtime/c/";
await mkdir(c,{recursive:true});
const entries=[];
for(const [folder,files]of [["json",["cJSON.c","cJSON.h","LICENSE","provenance.json"]],["sqlite",["sqlite3.c","sqlite3.h","academy-vfs.c","provenance.json"]],["portable",["academy_json.h"]]])for(const file of files){const target=file==="LICENSE"||file==="provenance.json"?folder+"-"+file:file;await copyFile("runtime/academy/"+folder+"/"+file,c+target);const bytes=await readFile(c+target);entries.push({file:target,bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")});}
const manifest=JSON.parse(await readFile(c+"manifest.json","utf8"));manifest.files=manifest.files.filter(file=>!entries.some(entry=>entry.file===file.file)).concat(entries);await writeFile(c+"manifest.json",JSON.stringify(manifest,null,2)+"\n");
const sql="public/academy/runtime/sql/";
await mkdir(sql,{recursive:true});
const source=await readFile("node_modules/sql.js/dist/sql-wasm.js","utf8");
await writeFile(sql+"sql-wasm.mjs",'let require,module,exports;\nif(typeof process!=="undefined"&&process.versions?.node)require=(await import("node:module")).createRequire(import.meta.url);\nconst __dirname=new URL(".",import.meta.url).pathname;\n'+source+"\nexport default initSqlJs;\n");
await copyFile("node_modules/sql.js/dist/sql-wasm.wasm",sql+"sql-wasm.wasm");
await copyFile("node_modules/sql.js/LICENSE",sql+"LICENSE");
const sqlFiles=[];for(const file of ["sql-wasm.mjs","sql-wasm.wasm","LICENSE"]){const bytes=await readFile(sql+file);sqlFiles.push({file,bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")});}
await writeFile(sql+"manifest.json",JSON.stringify({version:"1.14.2",source:"https://github.com/sql-js/sql.js/releases/tag/v1.14.2",files:sqlFiles},null,2)+"\n");
