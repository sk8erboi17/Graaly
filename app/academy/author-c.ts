import type { Challenge, Json } from "./types.ts";
export function cExercise(id:string,title:string,prototype:string,body:string,cases:[string,Json,Json][],rules:string[],hints:string[],why:string,cost="O(1).",extra:{declarations?:string;includes?:string;tags?:string[];modules?:string[];hard?:boolean}={}):Challenge {
  return {id,number:0,title,track:"C / WebAssembly",difficulty:extra.hard?"Hard":"Medium",mode:"c",tags:extra.tags??["C","memory","packets"],
    modules:extra.modules??["packets"],lessons:[],description:[title+" for a plugin's native data path."],requirements:rules,inputType:prototype,
    starters:{c:(extra.includes??"")+`${prototype} {\n    /* TODO: implement the contract. */\n    return 0;\n}\n`},
    solutions:{c:(extra.includes??"")+`${prototype} {\n${body.split("\n").map(line=>"    "+line).join("\n")}\n}\n`},
    cases:cases.map(([cExpression,input,expected],index)=>({cExpression,input,expected,name:(index<2?"Example ":"Edge case ")+(index+1),hidden:index>=2})),
    hints,explanation:[why,"The tests compile this code as C17 for wasm32-wasip1. The result follows the declared data contract; a native struct's object representation is never automatically a wire format."],complexity:cost,pitfalls:["Check boundaries before an operation that can overflow or shift by the operand width."],
    cDeclarations:extra.declarations,cPrint:'double result = (double)($EXPRESSION); printf("@@GRAALY@@%.17g\\n", result);',
  };
}
