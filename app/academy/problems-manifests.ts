import type { Challenge,Json } from "./types.ts";
function manifest(id:string,title:string,solution:string,rules:string[],checks:[string,Json][],why:string):Challenge {
  return {id,number:0,title,track:"Manifests and config",difficulty:"Medium",mode:"manifest",tags:["YAML","plugin.yml","configuration"],modules:["config","compatibility"],lessons:[17,19,31,35],description:["Write the YAML document required by this plugin bundle or configuration. The judge parses real YAML, rejects duplicate keys and checks field types and nested values."],requirements:rules,inputType:"YAML scalars, mappings and sequences. The test paths select actual parsed values, not source strings.",starters:{yaml:"# TODO: declare the required YAML document.\n"},solutions:{yaml:solution+"\n"},
    cases:[checks.slice(0,2),checks.slice(2,4),checks.slice(4)].filter(group=>group.length).map((group,index)=>({name:index?"Nested contract "+index:"Bundle contract",input:{paths:group.map(([path])=>path)},expected:Object.fromEntries(group),hidden:index>0})),hints:[rules[0],"A YAML sequence is a list, while nested keys need a mapping.","Quote scalars when their literal type or punctuation could be ambiguous."],explanation:[why,"The runtime chooses the language from the .jsplugin, .pyplugin or .cplugin bundle. plugin.yml still describes metadata, entrypoint, command declarations, dependencies and permissions."],complexity:"O(document size).",pitfalls:["Duplicate keys are rejected. Writing the same key twice does not merge two command or permission mappings."]};
}
export const manifestProblems=[
manifest("manifest-typescript","Declare a TypeScript build entrypoint",`name: AcademyShop
version: "1.0.0"
main: dist/main.mjs
commands:
  shop:
    description: Open the shop
    usage: /shop [page]
    aliases: [store]`,["Name AcademyShop, string version 1.0.0, main dist/main.mjs.","Declare shop description 'Open the shop', usage '/shop [page]', aliases [store]."],[["name","AcademyShop"],["version","1.0.0"],["main","dist/main.mjs"],["commands.shop.description","Open the shop"],["commands.shop.usage","/shop [page]"],["commands.shop.aliases",["store"]]],"The loader executes emitted JavaScript, so a TypeScript authoring file is not the deployed main entrypoint."),
manifest("manifest-python","Declare a Python bundle with service metadata",`name: AcademyPython
version: "2.0"
main: main.py
description: Python party service
authors: [Alex, Sam]
commands:
  party:
    usage: /party`,["Name AcademyPython, string version 2.0, main main.py.","Description 'Python party service', authors [Alex,Sam], party usage /party."],[["name","AcademyPython"],["version","2.0"],["main","main.py"],["description","Python party service"],["authors",["Alex","Sam"]],["commands.party.usage","/party"]],"YAML numeric coercion can turn an unquoted version into a number. The deployed descriptor should preserve the intended string metadata."),
manifest("manifest-c","Declare a compiled C WebAssembly bundle",`name: AcademyNative
version: "1.0.0"
main: dist/plugin.wasm
description: Native packet tools
depend: [PacketEvents]
commands:
  native:
    usage: /native`,["Name AcademyNative,version 1.0.0,main dist/plugin.wasm.","Require PacketEvents and declare native usage /native.","Description is 'Native packet tools'."],[["name","AcademyNative"],["main","dist/plugin.wasm"],["version","1.0.0"],["depend",["PacketEvents"]],["description","Native packet tools"],["commands.native.usage","/native"]],"A C bundle deploys the compiled WebAssembly artifact and must declare external plugins its initialization depends on."),
manifest("manifest-permissions","Declare permission defaults and child policy",`name: AcademyPolicy
version: "1"
main: main.mjs
permissions:
  academy.admin:
    default: op
    children:
      academy.read: true
      academy.write: true
  academy.read:
    default: true
  academy.write:
    default: false`,["Declare metadata AcademyPolicy,version string 1,main main.mjs.","academy.admin defaults op and grants read/write children.","read defaults true,write false; use booleans."],[["name","AcademyPolicy"],["main","main.mjs"],["permissions.academy.admin.default","op"],["permissions.academy.admin.children.academy.read",true],["permissions.academy.read.default",true],["permissions.academy.write.default",false],["permissions.academy.admin.children.academy.write",true]],"Permission defaults and inherited child grants are different declarations. A string 'false' must not be mistaken for a false boolean."),
manifest("manifest-dependencies","Distinguish required and optional integrations",`name: AcademyBridge
version: "1"
main: main.mjs
depend: [PacketEvents]
softdepend: [Vault]
loadbefore: [AcademyConsumer]
commands:
  bridge:
    permission: academy.bridge`,["PacketEvents is required; Vault is optional.","Load before AcademyConsumer.","Declare bridge command permission academy.bridge and metadata AcademyBridge/version string 1/main main.mjs."],[["name","AcademyBridge"],["depend",["PacketEvents"]],["softdepend",["Vault"]],["loadbefore",["AcademyConsumer"]],["commands.bridge.permission","academy.bridge"],["main","main.mjs"]],"Required dependencies gate startup, whereas optional integrations need capability checks when absent. Load ordering alone does not make a plugin required."),
manifest("manifest-generator","Declare startup loading for world generation",`name: AcademyTerrain
version: "1"
main: main.mjs
load: STARTUP
description: Deterministic terrain
commands:
  terrain:
    usage: /terrain <world>`,["Load AcademyTerrain at STARTUP.","main main.mjs, string version 1, description Deterministic terrain.","terrain usage /terrain <world>."],[["name","AcademyTerrain"],["load","STARTUP"],["main","main.mjs"],["version","1"],["description","Deterministic terrain"],["commands.terrain.usage","/terrain <world>"]],"A world generator must be available at the phase when worlds request it, so load phase is a functional part of deployment."),
manifest("config-native-values","Preserve configuration scalar types",`shop:
  enabled: true
  max_quantity: 64
  title: "Shop: Main"
backend:
  url: https://api.example.test
  timeout_ms: 1500
  retries: 3`,["shop.enabled=true,max_quantity=64,title='Shop: Main'.","backend.url=https://api.example.test,timeout_ms=1500,retries=3.","Use booleans/numbers rather than strings for typed values."],[["shop.enabled",true],["shop.max_quantity",64],["shop.title","Shop: Main"],["backend.url","https://api.example.test"],["backend.timeout_ms",1500],["backend.retries",3]],"Typed configuration lets startup validation distinguish a disabled feature from the truthy text 'false', and a duration from an arbitrary string."),
manifest("config-feature-gates","Declare explicit stable and experimental feature gates",`features:
  packets: true
  react: true
  html: true
  boards: false
limits:
  per_tick: 50
  session_ttl: 300`,["Enable packets,react,html and disable boards.","limits.per_tick=50,session_ttl=300.","Booleans must be real YAML booleans."],[["features.packets",true],["features.react",true],["features.html",true],["features.boards",false],["limits.per_tick",50],["limits.session_ttl",300]],"Configuration is not proof of platform support. The boards gate remains false because the current board renderer is experimental and unavailable."),
];
