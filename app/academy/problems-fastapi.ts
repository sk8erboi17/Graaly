import { pythonExercise } from "./author-python.ts";
import type { Json } from "./types.ts";
type Fixture=[Json,Json];
const req=(url:string,json?:Json,method=json===undefined?"GET":"POST",headers?:Record<string,string>,inspect_headers?:string[])=>({url,method,...(json===undefined?{}:{json}),...(headers?{headers}:{}),...(inspect_headers?{inspect_headers}:{})});
const response=(status:number,json:Json)=>({status,json});
const invalid=(loc:(string|number)[],type:string)=>({status:422,errors:[{loc,type}]});
function api(id:string,title:string,code:string,rules:string[],cases:Fixture[],hints:string[],why:string,lessons:number[],hard=false){
  return pythonExercise({id,title,track:"FastAPI / ASGI",mode:"fastapi",hard,tags:["FastAPI","ASGI","backend"],lessons,
    task:title+" for the plugin backend. Define app and async routes; the judge sends real ASGI requests to a fresh application per case.",rules,
    starter:'from fastapi import FastAPI, HTTPException, Depends, Header, Query\nfrom pydantic import BaseModel, Field, ConfigDict\n\napp = FastAPI()\n\n# TODO: declare models, dependencies and async endpoints.\n',solution:code,
    examples:cases.slice(0,1),extra:cases.slice(1),hints,why:[why,"Each request passes through FastAPI's routing, dependency resolution, validation and response serialization. The harness normalizes only 422 error locations/types, so the result does not depend on wording changes."],cost:"O(request payload + returned records), unless the endpoint's data operation requires more work."});
}
export const fastapiProblems=[
api("api-health","Versioned health endpoint",`from fastapi import FastAPI
app=FastAPI()
@app.get("/v1/health")
async def health():
    return {"ok":True,"service":"graaly"}`,["GET /v1/health returns 200 and {ok:true,service:'graaly'}.","Do not register /health; unknown routes stay 404."],[[{requests:[req("/v1/health")]},[response(200,{ok:true,service:"graaly"})]],[{requests:[req("/health")]},[response(404,{detail:"Not Found"})]],[{requests:[req("/v1/health",undefined,"POST")]},[response(405,{detail:"Method Not Allowed"})]]],["Register the exact prefixed route.","Use an async endpoint.","The HTTP method is part of route identity."],"A stable version prefix lets a plugin client select an explicit backend contract. Framework routing must reject accidental methods and unversioned aliases.",[18,20]),
api("api-path-validation","Typed player IDs in path parameters",`from fastapi import FastAPI,Path
app=FastAPI()
@app.get("/v1/players/{player_id}")
async def player(player_id:int=Path(gt=0)):
    return {"player_id":player_id}`,["GET /v1/players/{player_id} accepts a positive integer.","Malformed IDs return FastAPI 422 errors."],[[{requests:[req("/v1/players/7")]},[response(200,{player_id:7})]],[{requests:[req("/v1/players/nope")]},[invalid(["path","player_id"],"int_parsing")]],[{requests:[req("/v1/players/0")]},[invalid(["path","player_id"],"greater_than")]]],["Annotate the path field as int.","Use Path(gt=0).","Let FastAPI parse before running the endpoint."],"A path annotation is an executable boundary. Parsing and numeric range errors should be handled before player lookup.",[20,21]),
api("api-pagination","Bound query pagination",`from fastapi import FastAPI,Query
app=FastAPI()
@app.get("/v1/items")
async def items(offset:int=Query(default=0,ge=0),limit:int=Query(default=20,ge=1,le=100)):
    return {"offset":offset,"limit":limit}`,["GET /v1/items has offset>=0 default 0 and limit 1..100 default 20.","Reject invalid query values."],[[{requests:[req("/v1/items")]},[response(200,{offset:0,limit:20})]],[{requests:[req("/v1/items?offset=5&limit=2")]},[response(200,{offset:5,limit:2})]],[{requests:[req("/v1/items?limit=101")]},[invalid(["query","limit"],"less_than_equal")]],[{requests:[req("/v1/items?offset=-1")]},[invalid(["query","offset"],"greater_than_equal")]]],["Defaults are part of the contract.","Use Query constraints.","Test values exactly outside each bound."],"Bounding pagination limits both client ambiguity and resource use. Validation belongs before the query is constructed.",[20,21]),
api("api-purchase-body","Reject untrusted purchase fields",`from fastapi import FastAPI
from pydantic import BaseModel,Field,ConfigDict
class Purchase(BaseModel):
    model_config=ConfigDict(extra="forbid")
    sku:str
    quantity:int=Field(ge=1,le=64)
app=FastAPI()
@app.post("/v1/purchases",status_code=201)
async def purchase(body:Purchase):
    return {"sku":body.sku,"quantity":body.quantity}`,["POST /v1/purchases accepts sku and quantity in 1..64.","Return 201 with those fields.","Reject extra fields such as price."],[[{requests:[req("/v1/purchases",{sku:"stone",quantity:2})]},[response(201,{sku:"stone",quantity:2})]],[{requests:[req("/v1/purchases",{sku:"stone",quantity:0})]},[invalid(["body","quantity"],"greater_than_equal")]],[{requests:[req("/v1/purchases",{sku:"stone",quantity:1,price:0})]},[invalid(["body","price"],"extra_forbidden")]]],["Use a body BaseModel.","Choose an explicit success status.","Reject extra client-owned pricing fields."],"The backend owns price and stock. The schema must not accept a client price even when every declared field is otherwise valid.",[20,21,25]),
api("api-not-found","Separate missing resources from valid empty data",`from fastapi import FastAPI,HTTPException
app=FastAPI()
items={"stone":{"sku":"stone","stock":0}}
@app.get("/v1/items/{sku}")
async def item(sku:str):
    if sku not in items:raise HTTPException(404,"Unknown SKU")
    return items[sku]`,["stone exists with stock 0.","Unknown SKUs return 404 {detail:'Unknown SKU'}.","Do not confuse zero stock with a missing record."],[[{requests:[req("/v1/items/stone")]},[response(200,{sku:"stone",stock:0})]],[{requests:[req("/v1/items/book")]},[response(404,{detail:"Unknown SKU"})]],[{requests:[req("/v1/items/STONE")]},[response(404,{detail:"Unknown SKU"})]]],["Check membership, not truthiness of stock.","Raise HTTPException.","Keep the error detail stable."],"Presence and value are separate facts. A valid item with no stock still has an identity and a successful read response.",[20,22]),
api("api-response-contract","Filter internal state with response_model",`from fastapi import FastAPI
from pydantic import BaseModel
class PublicPlayer(BaseModel):
    name:str
    coins:int
app=FastAPI()
@app.get("/v1/me",response_model=PublicPlayer)
async def me():
    return {"name":"Alex","coins":10,"token":"internal-secret","admin":True}`,["GET /v1/me returns only name:'Alex',coins:10.","Declare a response model; internal token/admin fields must be filtered."],[[{requests:[req("/v1/me")]},[response(200,{name:"Alex",coins:10})]],[{requests:[req("/v1/me"),req("/v1/me")]},[response(200,{name:"Alex",coins:10}),response(200,{name:"Alex",coins:10})]],[{requests:[req("/v1/me",undefined,"POST")]},[response(405,{detail:"Method Not Allowed"})]]],["Input and output models can differ.","Attach response_model to the route.","Return internal state and let serialization enforce the output schema."],"Response filtering is a separate security boundary from request validation. Internal fields should not leak merely because a service dictionary contains them.",[20,21,30]),
api("api-key-dependency","Reusable async authentication dependency",`from fastapi import FastAPI,Header,HTTPException,Depends
app=FastAPI()
async def authorize(x_api_key:str|None=Header(default=None)):
    if x_api_key!="academy":raise HTTPException(401,"Invalid API key")
    return "plugin"
@app.get("/v1/private")
async def private(actor:str=Depends(authorize)):
    return {"actor":actor}`,["x-api-key='academy' authorizes GET /v1/private.","Missing or wrong keys return 401 {detail:'Invalid API key'}.","Implement auth in an async dependency."],[[{requests:[req("/v1/private",undefined,"GET",{"x-api-key":"academy"})]},[response(200,{actor:"plugin"})]],[{requests:[req("/v1/private")]},[response(401,{detail:"Invalid API key"})]],[{requests:[req("/v1/private",undefined,"GET",{"x-api-key":"wrong"})]},[response(401,{detail:"Invalid API key"})]]],["Header names map underscores to hyphens.","Allow None so your dependency owns the 401 response.","Depends injects the authorized identity."],"An async dependency shares authentication policy across routes without letting an endpoint forget its boundary. Credentials are not returned to the client.",[20,23,30]),
api("api-router-prefix","Compose a versioned router",`from fastapi import FastAPI,APIRouter
router=APIRouter(prefix="/shop")
@router.get("/catalog")
async def catalog():return {"items":["stone","book"]}
app=FastAPI()
app.include_router(router,prefix="/v1")`,["Define an APIRouter for /shop and mount at /v1.","GET /v1/shop/catalog returns the ordered catalog.","Unprefixed aliases remain 404."],[[{requests:[req("/v1/shop/catalog")]},[response(200,{items:["stone","book"]})]],[{requests:[req("/shop/catalog")]},[response(404,{detail:"Not Found"})]],[{requests:[req("/v1/catalog")]},[response(404,{detail:"Not Found"})]]],["Router and mount prefixes compose.","Register on the router.","include_router exposes the routes."],"Composing prefixes separates a domain router from deployment versioning while keeping the external URL explicit.",[20,29]),
api("api-lifespan","Initialize state inside application lifespan",`from fastapi import FastAPI,Request
from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app):
    app.state.visits=0
    yield
    app.state.visits=-1
app=FastAPI(lifespan=lifespan)
@app.get("/v1/visit")
async def visit(request:Request):
    request.app.state.visits+=1
    return {"visit":request.app.state.visits}`,["Initialize visits=0 in lifespan.","Each GET /v1/visit increments once.","Each test starts a fresh application lifespan."],[[{requests:[req("/v1/visit")]},[response(200,{visit:1})]],[{requests:[req("/v1/visit"),req("/v1/visit")]},[response(200,{visit:1}),response(200,{visit:2})]],[{requests:[req("/missing"),req("/v1/visit")]},[response(404,{detail:"Not Found"}),response(200,{visit:1})]]],["Pass a lifespan context manager to FastAPI.","Store application-owned state on app.state.","Increment only inside the matching endpoint."],"Startup ownership is explicit and teardown follows the context. Per-case lifespans also expose accidental dependence on state from earlier tests.",[24,27,29],true),
api("api-optimistic-update","Protect updates with optimistic revisions",`from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
class Update(BaseModel):
    revision:int
    value:int
app=FastAPI()
state={"revision":1,"value":0}
@app.put("/v1/state")
async def update(body:Update):
    if body.revision!=state["revision"]:raise HTTPException(409,"Stale revision")
    state.update(revision=state["revision"]+1,value=body.value)
    return state.copy()`,["Initial state is revision 1,value 0.","PUT /v1/state accepts revision/value; success increments revision.","A stale revision returns 409 and makes no mutation."],[[{requests:[req("/v1/state",{revision:1,value:7},"PUT")]},[response(200,{revision:2,value:7})]],[{requests:[req("/v1/state",{revision:0,value:9},"PUT"),req("/v1/state",{revision:1,value:3},"PUT")]},[response(409,{detail:"Stale revision"}),response(200,{revision:2,value:3})]],[{requests:[req("/v1/state",{revision:1,value:1},"PUT"),req("/v1/state",{revision:1,value:2},"PUT")]},[response(200,{revision:2,value:1}),response(409,{detail:"Stale revision"})]]],["Compare before assigning.","Return a copy of committed state.","Every accepted write advances revision."],"Optimistic concurrency prevents a stale UI from silently overwriting a newer value. The rejected path must have no side effects.",[22,25,34],true),
api("api-idempotency","Replay idempotent writes and reject key conflicts",`from fastapi import FastAPI,HTTPException,Header
from pydantic import BaseModel
class Order(BaseModel):
    sku:str
app=FastAPI()
orders={}
@app.post("/v1/orders",status_code=201)
async def order(body:Order,idempotency_key:str=Header()):
    if idempotency_key in orders:
        saved=orders[idempotency_key]
        if saved["sku"]!=body.sku:raise HTTPException(409,"Key conflict")
        return saved
    saved={"id":len(orders)+1,"sku":body.sku}
    orders[idempotency_key]=saved
    return saved`,["POST /v1/orders requires idempotency-key header and sku body.","Assign monotonically increasing IDs starting at 1.","Same key/body replays; same key/different SKU returns 409."],[[{requests:[req("/v1/orders",{sku:"stone"},"POST",{"idempotency-key":"a"})]},[response(201,{id:1,sku:"stone"})]],[{requests:[req("/v1/orders",{sku:"stone"},"POST",{"idempotency-key":"a"}),req("/v1/orders",{sku:"stone"},"POST",{"idempotency-key":"a"})]},[response(201,{id:1,sku:"stone"}),response(201,{id:1,sku:"stone"})]],[{requests:[req("/v1/orders",{sku:"stone"},"POST",{"idempotency-key":"a"}),req("/v1/orders",{sku:"book"},"POST",{"idempotency-key":"a"}),req("/v1/orders",{sku:"book"},"POST",{"idempotency-key":"b"})]},[response(201,{id:1,sku:"stone"}),response(409,{detail:"Key conflict"}),response(201,{id:2,sku:"book"})]]],["Store the committed result by key.","A replay must compare the payload.","A conflict cannot consume a new ID."],"Idempotency is a mapping from a key and request identity to one committed result. Reusing only the key without verifying identity can return another operation's result.",[25,35],true),
api("api-exception-handler","Normalize domain failures centrally",`from fastapi import FastAPI
from fastapi.responses import JSONResponse
class SoldOut(Exception):pass
app=FastAPI()
@app.exception_handler(SoldOut)
async def sold_out(request,error):
    return JSONResponse(status_code=409,content={"code":"sold_out"})
@app.post("/v1/buy/{sku}")
async def buy(sku:str):
    if sku=="stone":raise SoldOut()
    return {"sku":sku}`,["Buying stone raises a SoldOut domain exception.","A registered handler maps it to 409 {code:'sold_out'}.","Other SKUs return 200 with sku."],[[{requests:[req("/v1/buy/stone",undefined,"POST")]},[response(409,{code:"sold_out"})]],[{requests:[req("/v1/buy/book",undefined,"POST")]},[response(200,{sku:"book"})]],[{requests:[req("/v1/buy/stone",undefined,"POST"),req("/v1/buy/book",undefined,"POST")]},[response(409,{code:"sold_out"}),response(200,{sku:"book"})]]],["Keep domain exceptions separate from HTTP concerns.","Register an async exception handler.","Return JSONResponse with an explicit status."],"Central mapping keeps service code reusable while publishing one stable client error code. An unhandled exception would become a server failure.",[20,26,29]),
api("api-request-id","Propagate request IDs through middleware",`from fastapi import FastAPI,Request
app=FastAPI()
@app.middleware("http")
async def correlation(request:Request,call_next):
    response=await call_next(request)
    response.headers["x-request-id"]=request.headers.get("x-request-id","missing")
    return response
@app.get("/v1/ping")
async def ping():return {"pong":True}`,["Echo x-request-id on every HTTP response.","Default to 'missing'.","GET /v1/ping returns {pong:true}."],[[{requests:[req("/v1/ping",undefined,"GET",{"x-request-id":"abc"},["x-request-id"])]},[{status:200,json:{pong:true},headers:{"x-request-id":"abc"}}]],[{requests:[req("/v1/ping",undefined,"GET",undefined,["x-request-id"])]},[{status:200,json:{pong:true},headers:{"x-request-id":"missing"}}]],[{requests:[req("/missing",undefined,"GET",{"x-request-id":"err"},["x-request-id"])]},[{status:404,json:{detail:"Not Found"},headers:{"x-request-id":"err"}}]]],["Wrap call_next.","Modify the returned response headers.","Middleware also sees framework-generated 404 responses."],"Correlation belongs to the request pipeline so failures remain traceable as well as successful endpoint calls.",[20,26,36],true),
api("api-background-audit","Run asynchronous background audit tasks",`from fastapi import FastAPI,BackgroundTasks
from pydantic import BaseModel
app=FastAPI()
audit=[]
class Entry(BaseModel):
    name:str
async def record(name):audit.append(name)
@app.post("/v1/audit",status_code=202)
async def enqueue(body:Entry,tasks:BackgroundTasks):
    tasks.add_task(record,body.name)
    return {"queued":True}
@app.get("/v1/audit")
async def read():return {"entries":list(audit)}`,["POST /v1/audit queues an async record task and returns 202 {queued:true}.","GET returns ordered entries.","Background work is complete when an ASGI request finishes in these fixtures."],[[{requests:[req("/v1/audit",{name:"Alex"}),req("/v1/audit")]},[response(202,{queued:true}),response(200,{entries:["Alex"]})]],[{requests:[req("/v1/audit")]},[response(200,{entries:[]})]],[{requests:[req("/v1/audit",{name:"a"}),req("/v1/audit",{name:"b"}),req("/v1/audit")]},[response(202,{queued:true}),response(202,{queued:true}),response(200,{entries:["a","b"]})]]],["Inject BackgroundTasks.","Register an async function, not its already-evaluated result.","Read a copy of the application list."],"BackgroundTasks schedules after-response work within the request lifecycle. It is not a durable queue; production recovery needs persisted intent.",[24,26,35]),
api("api-websocket","Validate and echo WebSocket JSON frames",`from fastapi import FastAPI,WebSocket,WebSocketDisconnect
app=FastAPI()
@app.websocket("/v1/ws")
async def socket(ws:WebSocket):
    await ws.accept()
    try:
        while True:
            message=await ws.receive_json()
            await ws.send_json({"echo":message})
    except WebSocketDisconnect:
        pass`,["Accept /v1/ws.","Each JSON frame receives {echo:frame} in order.","Handle client disconnect without a server error."],[[{websocket:{url:"/v1/ws",messages:[{kind:"join"}]}},[{echo:{kind:"join"}}]],[{websocket:{url:"/v1/ws",messages:[]}},[]],[{websocket:{url:"/v1/ws",messages:[{seq:1},{seq:2}]}},[{echo:{seq:1}},{echo:{seq:2}}]]],["Accept before reading frames.","Use receive_json/send_json.","Catch WebSocketDisconnect outside the loop."],"WebSocket messages use a different ASGI lifecycle from HTTP. Disconnect is a normal termination path that must release connection-owned work.",[23,24,33],true),
api("api-websocket-auth","Reject unauthenticated WebSocket handshakes",`from fastapi import FastAPI,WebSocket,WebSocketDisconnect
app=FastAPI()
@app.websocket("/v1/ws")
async def socket(ws:WebSocket):
    if ws.query_params.get("token")!="academy":
        await ws.close(code=1008)
        return
    await ws.accept()
    try:
        while True:
            value=await ws.receive_json()
            await ws.send_json({"ok":True,"value":value})
    except WebSocketDisconnect:pass`,["Require token=academy before accepting /v1/ws.","Invalid/missing tokens close with 1008.","Authorized JSON frames return {ok:true,value:frame}."],[[{websocket:{url:"/v1/ws?token=academy",messages:[{seq:1}]}},[{ok:true,value:{seq:1}}]],[{websocket:{url:"/v1/ws",messages:[]}},[{close:1008}]],[{websocket:{url:"/v1/ws?token=wrong",messages:[{seq:9}]}},[{close:1008}]]],["Read query_params before accept.","Close and return on authorization failure.","Never process an unauthorized frame."],"Authentication must guard the handshake before connection state is allocated. Rejecting frames after acceptance gives an unauthorized peer a larger surface.",[23,30,33],true),
];
