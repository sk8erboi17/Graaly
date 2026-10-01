import { pythonExercise } from "./author-python.ts";
import type { Json } from "./types.ts";
function py(id:string,title:string,solution:string,rules:string[],cases:[Json,Json][],why:string,hard=false,asgi=false){return pythonExercise({id,title,track:asgi?"ASGI protocol":"Python",mode:asgi?"asgi":"python",hard,tags:["Python",asgi?"ASGI":"domain logic"],lessons:asgi?[18,20,24,26]:[19,34],task:title+" in executable Python. "+(asgi?"Export an async ASGI app(scope,receive,send); the judge sends real protocol messages.":"Implement solve(input) and return the required JSON-compatible result."),rules,starter:asgi?'async def app(scope, receive, send):\n    # TODO: implement the HTTP protocol.\n    raise NotImplementedError()\n':'def solve(input):\n    # TODO: implement the data contract.\n    raise NotImplementedError()\n',solution,examples:cases.slice(0,1),extra:cases.slice(1),hints:[rules[0],asgi?"HTTP request/response bodies arrive through protocol messages, not scope fields.":"Use Python data structures without mutating the caller's containers.",why],why:[why,"The browser executes the submitted Python source. Syntax, runtime exceptions, returned values and protocol messages are graded rather than inferred from text patterns."],cost:"O(input and output size), except explicitly described sorting or aggregation."});}
export const pythonProblems=[
py("python-event-groups","Group event counts with deterministic output",`from collections import Counter
def solve(input):
    counts=Counter(event["player"] for event in input["events"] if event["kind"]=="join")
    return [{"player":name,"joins":counts[name]} for name in sorted(counts)]`,["Count only join events by player.","Return player/joins records sorted by name."],[[{events:[{kind:"join",player:"B"},{kind:"quit",player:"A"},{kind:"join",player:"B"},{kind:"join",player:"A"}]},[{player:"A",joins:1},{player:"B",joins:2}]],[{events:[]},[]],[{events:[{kind:"quit",player:"A"}]},[]]],"Counter aggregates identities while the final sort defines a deterministic output independent of first arrival."),
py("python-decimal-cart","Calculate a decimal cart total exactly",`from decimal import Decimal
def solve(input):
    total=sum((Decimal(item["price"])*item["quantity"] for item in input["items"]),Decimal(0))
    return format(total,".2f")`,["Prices are nonnegative decimal strings with at most two fractional digits.","Quantities are integers; return total as a string with two decimals."],[[{items:[{price:"0.10",quantity:3},{price:"0.20",quantity:1}]},"0.50"],[{items:[]},"0.00"],[{items:[{price:"99.99",quantity:2}]},"199.98"]],"Decimal constructs a base-10 amount from the price text. Starting the sum with Decimal(0) keeps empty and populated totals in the same domain."),
py("python-utc-order","Order timestamped events by actual instants",`from datetime import datetime
def solve(input):
    def instant(event):
        value=datetime.fromisoformat(event["at"].replace("Z","+00:00"))
        if value.tzinfo is None:raise ValueError("Naive timestamp")
        return value
    return [event["id"] for event in sorted(input["events"],key=instant)]`,["Inputs are timezone-aware ISO timestamps.","Sort by actual instant; preserve input order for ties."],[[{events:[{id:"a",at:"2026-10-01T12:00:00+02:00"},{id:"b",at:"2026-10-01T09:30:00Z"}]},["b","a"]],[{events:[]},[]],[{events:[{id:"a",at:"2026-10-01T12:00:00+02:00"},{id:"b",at:"2026-10-01T10:00:00Z"}]},["a","b"]]],"Offset-aware datetime comparison orders real instants. Text sorting would confuse a timestamp's local wall-clock notation with universal time."),
py("python-context-cleanup","Release a session on success and failure",`from contextlib import contextmanager
def solve(input):
    trace=[]
    @contextmanager
    def session():
        trace.append("open")
        try:yield
        finally:trace.append("close")
    try:
        with session():
            trace.append("work")
            if input["fail"]:raise ValueError("Denied")
            trace.append("commit")
    except ValueError:trace.append("handled")
    return trace`,["Trace open/work/commit/close on success.","On failure trace open/work/close/handled.","Cleanup must run before the exception handler."],[[{fail:false},["open","work","commit","close"]],[{fail:true},["open","work","close","handled"]],[{fail:false,unused:1},["open","work","commit","close"]]],"A context manager's finally block owns resource release. Handling a failure outside the context proves cleanup precedes recovery.",true),
py("python-async-gather","Preserve input order across concurrent awaitables",`import asyncio
async def solve(input):
    async def calculate(item):
        for _ in range(item["steps"]):await asyncio.sleep(0)
        return {"id":item["id"],"value":item["value"]*2}
    return await asyncio.gather(*(calculate(item) for item in input["items"]))`,["Each item yields steps times, then doubles value.","Return records in input order regardless of completion order.","No OS threads are required."],[[{items:[{id:"slow",steps:3,value:2},{id:"fast",steps:0,value:4}]},[{id:"slow",value:4},{id:"fast",value:8}]],[{items:[]},[]],[{items:[{id:"zero",steps:0,value:0}]},[{id:"zero",value:0}]]],"asyncio.gather preserves the awaitable argument order while allowing work to interleave. Completion order is not the caller's result ordering."),
py("python-dataclass-copy","Publish a normalized dataclass without sharing mutable input",`from dataclasses import dataclass,field,asdict
@dataclass(frozen=True)
class Party:
    name:str
    members:tuple[str,...]
def solve(input):
    party=Party(input["name"].strip(),tuple(dict.fromkeys(input["members"])))
    return {"name":party.name,"members":list(party.members)}`, ["Strip party name and deduplicate members in first-seen order.","Represent owned members as an immutable tuple before publishing a JSON list."],[[{name:" x ",members:["a","a","b"]},{name:"x",members:["a","b"]}],[{name:"empty",members:[]},{name:"empty",members:[]}],[{name:"x",members:["b","a"]},{name:"x",members:["b","a"]}]],"An immutable domain record defines ownership before serialization. Copying and canonicalization keep a mutable request list from becoming shared application state."),
py("python-generator-limit","Limit filtered event consumption",`from itertools import islice
def solve(input):
    matching=(event["id"] for event in input["events"] if event["severity"]>=input["minimum"])
    return list(islice(matching,max(0,input["limit"])))`,["Keep event IDs with severity>=minimum in arrival order.","Return at most limit IDs; nonpositive limits return []."],[[{minimum:2,limit:2,events:[{id:"a",severity:1},{id:"b",severity:2},{id:"c",severity:3},{id:"d",severity:4}]},["b","c"]],[{minimum:0,limit:0,events:[{id:"a",severity:1}]},[]],[{minimum:3,limit:2,events:[{id:"a",severity:2}]},[]]],"A generator plus islice consumes only enough matching values to satisfy the requested limit rather than constructing the entire filtered result."),
py("python-strict-parser","Reject booleans at an integer command boundary",`def solve(input):
    value=input["quantity"]
    if type(value) is not int or not 1<=value<=64:
        return {"ok":False}
    return {"ok":True,"quantity":value}`, ["Accept only real integer quantities in 1..64.","Reject booleans, strings and floats."],[[{quantity:4},{ok:true,quantity:4}],[{quantity:true},{ok:false}],[{quantity:"4"},{ok:false}],[{quantity:65},{ok:false}]],"bool subclasses int in Python. A strict boundary needs an exact integer type or a validation library configured to reject coercion."),
py("asgi-routing","Implement raw ASGI HTTP routing",`import json
async def app(scope,receive,send):
    found=scope["method"]=="GET" and scope["path"]=="/health"
    await send({"type":"http.response.start","status":200 if found else 404,"headers":[(b"content-type",b"application/json")]})
    await send({"type":"http.response.body","body":json.dumps({"ok":True} if found else {"error":"not_found"}).encode()})`,["GET /health returns 200 {ok:true}.","Other paths/methods return 404 {error:'not_found'}.","Send response.start before response.body."],[[{requests:[{url:"/health",method:"GET"}]},[{status:200,json:{ok:true}}]],[{requests:[{url:"/missing",method:"GET"}]},[{status:404,json:{error:"not_found"}}]],[{requests:[{url:"/health",method:"POST"}]},[{status:404,json:{error:"not_found"}}]]],"ASGI separates immutable request scope from asynchronous receive/send channels. The response is an ordered protocol, not a returned dictionary.",true,true),
py("asgi-body-chunks","Read all ASGI body chunks before decoding",`import json
async def app(scope,receive,send):
    body=b""
    while True:
        message=await receive()
        body+=message.get("body",b"")
        if not message.get("more_body",False):break
    payload={"bytes":len(body),"text":body.decode()}
    await send({"type":"http.response.start","status":200,"headers":[]})
    await send({"type":"http.response.body","body":json.dumps(payload).encode()})`,["Consume all http.request chunks until more_body=false.","Return UTF-8 text and byte count.","Byte count differs from character count for Unicode."],[[{requests:[{url:"/echo",method:"POST",chunks:["he","llo"]}]},[{status:200,json:{bytes:5,text:"hello"}}]],[{requests:[{url:"/echo",method:"POST",chunks:["","é"]}]},[{status:200,json:{bytes:2,text:"é"}}]],[{requests:[{url:"/echo",method:"POST",body:""}]},[{status:200,json:{bytes:0,text:""}}]]],"The first body message is not necessarily the complete request. Concatenate bytes across chunk boundaries before decoding a UTF-8 value.",true,true),
py("asgi-header-auth","Authorize a raw ASGI request from byte headers",`import json
async def app(scope,receive,send):
    headers=dict(scope["headers"])
    ok=headers.get(b"x-api-key")==b"academy"
    await send({"type":"http.response.start","status":200 if ok else 401,"headers":[]})
    await send({"type":"http.response.body","body":json.dumps({"ok":ok}).encode()})`,["x-api-key=academy authorizes with 200 {ok:true}.","Missing/wrong keys return 401 {ok:false}.","ASGI header names and values are bytes."],[[{requests:[{url:"/private",headers:{"x-api-key":"academy"}}]},[{status:200,json:{ok:true}}]],[{requests:[{url:"/private"}]},[{status:401,json:{ok:false}}]],[{requests:[{url:"/private",headers:{"X-Api-Key":"wrong"}}]},[{status:401,json:{ok:false}}]]],"ASGI headers are byte pairs, while application code often uses strings. Comparing across those domains silently rejects a valid credential.",false,true),
py("asgi-stream-response","Send a response through explicit body frames",`async def app(scope,receive,send):
    await send({"type":"http.response.start","status":200,"headers":[]})
    for body,more in [(b"[",True),(b"1,2",True),(b"]",False)]:
        await send({"type":"http.response.body","body":body,"more_body":more})`,["Return JSON [1,2] through exactly three body frames '[','1,2',']'.","more_body is true,true,false.","The judge inspects both combined JSON and frame boundaries."],[[{requests:[{url:"/stream",inspect_frames:true}]},[{status:200,json:[1,2],frames:[{bytes:1,more:true},{bytes:3,more:true},{bytes:1,more:false}]}]],[{requests:[{url:"/stream"}]},[{status:200,json:[1,2]}]],[{requests:[{url:"/stream?x=1",inspect_frames:true}]},[{status:200,json:[1,2],frames:[{bytes:1,more:true},{bytes:3,more:true},{bytes:1,more:false}]}]]],"Streaming responses finish only when a frame explicitly clears more_body. The last frame terminates the response without requiring another request message.",true,true),
];
