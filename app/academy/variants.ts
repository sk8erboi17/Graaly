import { portableSolutions } from "./generated-variants.ts";
import type { Challenge, ChallengeExecution, ChallengeLanguage } from "./types.ts";
import { cInputs } from "./c-inputs.ts";

export const universalVariants:ChallengeLanguage[]=["ts","js","py","c","react-ts","react-js","fastapi","pydantic","asgi","plugin-ts","plugin-js","html"];
const pureContract="Implement solve(input) → JSON. Preserve the caller's input. All environments run the same examples and edge cases.";
const reactWrapper=(source:string)=>source+`\nimport React, { useMemo } from "react";
import { Message } from "@graaly/react";
export default function App({ input }) {
  const result = useMemo(() => solve(input), [input]);
  return <Message>{JSON.stringify(result)}</Message>;
}\n`;
const modelProbe=`
def academy_model_probe(input):
    from pydantic import ValidationError
    probe = input["__modelProbe"]
    first = Request.model_validate(probe["data"])
    second = Request.model_validate(probe["data"])
    frozen = False
    try:
        setattr(first, probe["field"], probe["value"])
    except ValidationError as error:
        frozen = error.errors()[0]["type"] == "frozen_instance"
    first.scopes.append("probe")
    return {"frozen": frozen, "independent_defaults": second.scopes == []}
`;
const fastapiWrapper=(source:string,probe=false)=>source+(probe?modelProbe:"")+`\nfrom fastapi import FastAPI, Body
from typing import Any
import inspect
app = FastAPI()

@app.post("/solve")
async def solve_endpoint(input: Any = Body(...)):
    result = ${probe?'academy_model_probe(input) if "__modelProbe" in input else solve(input)':'solve(input)'}
    return await result if inspect.isawaitable(result) else result
`;
const asgiWrapper=(source:string,probe=false)=>source+(probe?modelProbe:"")+`
import json
import inspect

async def app(scope, receive, send):
    body = b""
    while True:
        frame = await receive()
        body += frame.get("body", b"")
        if not frame.get("more_body", False):
            break
    input = json.loads(body)
    result = ${probe?'academy_model_probe(input) if "__modelProbe" in input else solve(input)':'solve(input)'}
    if inspect.isawaitable(result):
        result = await result
    payload = json.dumps(result, allow_nan=False).encode()
    await send({"type": "http.response.start", "status": 200,
                "headers": [(b"content-type", b"application/json")]})
    await send({"type": "http.response.body", "body": payload, "more_body": False})
`;
const pluginWrapper=(source:string)=>source+`\nimport { info } from "graaly";
export async function setup(input) {
  const result = await solve(input);
  info(JSON.stringify(result));
}\n`;
const htmlWrapper=(source:string)=>`<style>
  main { background: navy; }
  .result { grid-row: 1; grid-column: 1 / span 9; color: white; }
</style>
<main id="academy" data-rows="1" aria-label="Exercise result">
  <button class="result" data-action="academy.result" data-material="PAPER">{{result}}</button>
</main>
<script type="module" data-academy-solution>
${source}</script>\n`;
const pydanticWrapper=(source:string)=>source.replace("def solve(input):","def solve_value(input):")+`\nfrom pydantic import RootModel, JsonValue

class Input(RootModel[JsonValue]):
    pass

class Output(RootModel[JsonValue]):
    pass

async def solve(input):
    import inspect
    request = Input.model_validate(input)
    result = solve_value(request.root)
    if inspect.isawaitable(result):
        result = await result
    return Output.model_validate(result).model_dump(mode="json")
`;
const jsStarter=(title:string)=>`/** ${title} */\nexport function solve(input) {\n  // TODO: implement the requirements without changing input.\n  throw new Error("Not implemented");\n}\n`;
const pyStarter=(title:string)=>`# ${title}\nfrom graaly_academy import *\n\ndef solve(input):\n    # TODO: implement the requirements without changing input.\n    raise NotImplementedError("Implement solve(input)")\n`;

export function addExecutionVariants(problem:Challenge):Challenge{
  if(cInputs[problem.id])problem={...problem,cases:problem.cases.map((test,index)=>({...test,input:cInputs[problem.id][index]}))};
  const portable=portableSolutions[problem.id];
  if(!portable)return problem; // The complete-coverage check rejects omissions before publication.
  const original={starters:{...problem.starters},solutions:{...problem.solutions}};
  const starters={...original.starters},solutions={...original.solutions};
  const variants:Partial<Record<ChallengeLanguage,ChallengeExecution>>={};
  const modelNote=problem.mode==="react"?"This profile implements the component's state transitions and native snapshot contract with JSON. Choose React to implement and execute the component and hooks.":problem.mode==="fastapi"||problem.mode==="asgi"?"This profile implements the endpoint's request/response behavior with JSON fixtures. Choose FastAPI or ASGI to execute the actual application.":problem.mode==="plugin"?"This profile implements the SDK callback's observable effects as a JSON trace. Choose Graaly plugin to register and drive the actual SDK callbacks.":problem.mode==="html-css"?"This profile builds the equivalent native inventory layout as JSON. Choose HTML / CSS to compile native markup and styling.":problem.mode==="pydantic"?"This profile implements the validation and serialization contract. Python and Pydantic execute the original Pydantic models.":problem.mode==="c"?"This profile implements the native algorithm's observable JSON contract. Exact 64-bit input words use hexadecimal strings. C measures the actual ABI and memory operations; other profiles calculate their specified behavior.":undefined;
  const plain:ChallengeExecution={mode:"function",inputType:pureContract,portable:true,note:modelNote};
  const js=problem.mode==="function"?original.solutions.js!:portable.js;
  const py=["python","pydantic"].includes(problem.mode)?original.solutions.py!:portable.py;
  const jsStart=problem.mode==="function"?original.starters.js!:jsStarter(problem.title);
  const pyStart=["python","pydantic"].includes(problem.mode)?original.starters.py!:pyStarter(problem.title);
  for(const language of ["js","ts"] as const){solutions[language]=js;starters[language]=jsStart;variants[language]=plain;}
  solutions.py=py;starters.py=pyStart;variants.py={...plain,mode:problem.mode==="pydantic"?"pydantic":"python"};
  if(problem.mode==="c")variants.c={mode:"c",inputType:problem.inputType};
  else {solutions.c=portable.c;starters.c=`#include <graaly/academy_json.h>\n\nJ *solve(J *input) {\n    // TODO: read with j_get; build a result with j_object/j_array.\n    academy_error("Implement solve(input)");\n    return j_null();\n}\n`;variants.c={...plain,mode:"c",jsonFunction:"c",cDeclarations:"",cPrint:""};}
  for(const [choice,native]of [["react-ts","ts"],["react-js","js"]] as const){solutions[choice]=problem.mode==="react"?original.solutions[native]:reactWrapper(js);starters[choice]=problem.mode==="react"?original.starters[native]:reactWrapper(jsStart);variants[choice]=problem.mode==="react"?{mode:"react",inputType:problem.inputType}:{...plain,mode:"react",jsonFunction:"react",inputType:pureContract+" Render App({input}) with exactly one Message containing JSON.stringify(result). The actual Graaly React reconciler runs the component."};}
  solutions.fastapi=problem.mode==="fastapi"?original.solutions.py:fastapiWrapper(py,problem.mode==="pydantic");
  starters.fastapi=problem.mode==="fastapi"?original.starters.py:fastapiWrapper(pyStart,problem.mode==="pydantic");
  variants.fastapi=problem.mode==="fastapi"?{mode:"fastapi",inputType:problem.inputType}:{...plain,mode:"fastapi",jsonFunction:"fastapi",inputType:pureContract+" Define app and POST /solve. The harness sends an actual ASGI HTTP request and checks HTTP 200 and its JSON body."};
  solutions.pydantic=problem.mode==="pydantic"?original.solutions.py:pydanticWrapper(py);
  starters.pydantic=problem.mode==="pydantic"?original.starters.py:pydanticWrapper(pyStart);
  variants.pydantic=problem.mode==="pydantic"?{mode:"pydantic",inputType:problem.inputType}:{...plain,mode:"python",inputType:pureContract+" Validate JSON input and output with real Pydantic RootModel[JsonValue]. Add domain models as needed."};
  solutions.asgi=problem.mode==="asgi"?original.solutions.py:asgiWrapper(py,problem.mode==="pydantic");starters.asgi=problem.mode==="asgi"?original.starters.py:asgiWrapper(pyStart,problem.mode==="pydantic");
  variants.asgi=problem.mode==="asgi"?{mode:"asgi",inputType:problem.inputType}:{...plain,mode:"asgi",jsonFunction:"asgi",inputType:pureContract+" Define app(scope,receive,send); the harness sends JSON to /solve and validates actual ASGI response ordering and the final body frame."};
  for(const [choice,native]of [["plugin-ts","ts"],["plugin-js","js"]] as const){solutions[choice]=problem.mode==="plugin"?original.solutions[native]:pluginWrapper(js);starters[choice]=problem.mode==="plugin"?original.starters[native]:pluginWrapper(jsStart);variants[choice]=problem.mode==="plugin"?{mode:"plugin",inputType:problem.inputType}:{...plain,mode:"plugin",jsonFunction:"plugin",inputType:pureContract+" Export setup(input). Send exactly one info(JSON.stringify(result)) through the real SDK adapter."};}
  if(problem.mode!=="html-css"){solutions.html=htmlWrapper(js);starters.html=htmlWrapper(jsStart);variants.html={...plain,mode:"function",jsonFunction:"html",inputType:pureContract+" Put solve(input) inside <script type=module data-academy-solution>. Native HTML/CSS renders {{result}}. Keep data-action=academy.result on the result item. JavaScript supplies the algorithm; the native compiler checks the markup and CSS."};}
  return {...problem,starters,solutions,variants};
}

export function resolveVariant(problem:Challenge,language:ChallengeLanguage):Challenge{
  const variant=problem.variants?.[language];
  return variant?{...problem,jsonFunction:undefined,portable:false,...variant}:problem;
}
