"""Trusted browser harness. Student source is executed in a fresh namespace per case."""
import json
import inspect
import sqlite3
import sys
import types
import copy
from urllib.parse import urlsplit
from contextlib import asynccontextmanager

@asynccontextmanager
async def academy_empty_lifespan(app):
    yield


async def academy_http(app, request):
    url = urlsplit(request.get("url", "/"))
    body = json.dumps(request["json"]).encode() if "json" in request else request.get("body", "").encode()
    headers = {"host": "academy.local", **request.get("headers", {})}
    if "json" in request:
        headers.setdefault("content-type", "application/json")
    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": request.get("method", "GET"),
             "scheme": "http", "path": url.path or "/", "raw_path": (url.path or "/").encode(), "query_string": url.query.encode(),
             "root_path": "", "headers": [(str(k).lower().encode(), str(v).encode()) for k, v in headers.items()],
             "client": ("127.0.0.1", 1234), "server": ("academy.local", 80)}
    messages = []
    chunks = [chunk.encode() for chunk in request["chunks"]] if "chunks" in request else [body]

    async def receive():
        if not chunks:
            return {"type": "http.disconnect"}
        body = chunks.pop(0)
        return {"type": "http.request", "body": body, "more_body": bool(chunks)}

    async def send(message):
        starts = [item for item in messages if item["type"] == "http.response.start"]
        bodies = [item for item in messages if item["type"] == "http.response.body"]
        if message["type"] == "http.response.start":
            if starts or bodies:
                raise RuntimeError("ASGI must send exactly one response start before its body")
        elif message["type"] == "http.response.body":
            if not starts or (bodies and not bodies[-1].get("more_body", False)):
                raise RuntimeError("ASGI body frames must follow response start and stop after the final frame")
        else:
            raise RuntimeError("Unsupported ASGI HTTP response message: " + str(message["type"]))
        messages.append(message)

    await app(scope, receive, send)
    bodies = [message for message in messages if message["type"] == "http.response.body"]
    if not bodies or bodies[-1].get("more_body", False):
        raise RuntimeError("ASGI response must finish with a body frame whose more_body is false")
    start = next(message for message in messages if message["type"] == "http.response.start")
    raw = b"".join(message.get("body", b"") for message in messages if message["type"] == "http.response.body")
    payload = json.loads(raw) if raw else None
    result = {"status": start["status"]}
    if start["status"] == 422 and isinstance(payload, dict) and isinstance(payload.get("detail"), list):
        result["errors"] = [{"loc": item["loc"], "type": item["type"]} for item in payload["detail"]]
    else:
        result["json"] = payload
    if request.get("inspect_headers"):
        response_headers = {k.decode(): v.decode() for k, v in start.get("headers", [])}
        result["headers"] = {key: response_headers.get(key) for key in request["inspect_headers"]}
    if request.get("inspect_frames"):
        result["frames"] = [{"bytes": len(message.get("body", b"")), "more": message.get("more_body", False)} for message in messages if message["type"] == "http.response.body"]
    return result


async def academy_websocket(app, request):
    url = urlsplit(request.get("url", "/ws"))
    pending = [{"type": "websocket.connect"}] + [{"type": "websocket.receive", "text": json.dumps(value)} for value in request.get("messages", [])]
    pending.append({"type": "websocket.disconnect", "code": 1000})
    output = []
    scope = {"type": "websocket", "asgi": {"version": "3.0"}, "scheme": "ws", "path": url.path, "root_path": "",
             "query_string": url.query.encode(), "headers": [], "client": ("127.0.0.1", 1234), "server": ("academy.local", 80), "subprotocols": []}
    async def receive():
        if not pending:
            raise RuntimeError("WebSocket consumed beyond the supplied test messages")
        return pending.pop(0)
    async def send(message):
        if message["type"] == "websocket.send":
            output.append(json.loads(message["text"]))
        elif message["type"] == "websocket.close":
            output.append({"close": message.get("code", 1000)})
    await app(scope, receive, send)
    return output


async def academy_run():
    fixture = json.loads(__fixture_json)
    helpers = globals().get("__portable_helpers", "")
    if helpers:
        module = types.ModuleType("graaly_academy")
        exec(compile(helpers, "graaly_academy.py", "exec"), module.__dict__)
        sys.modules["graaly_academy"] = module
    if __mode == "sql":
        database = sqlite3.connect(":memory:")
        database.row_factory = sqlite3.Row
        database.execute("PRAGMA foreign_keys=ON")
        try:
            database.executescript(__schema)
            database.executescript(fixture.get("setup", ""))
            statements = []
            current = ""
            for character in __source:
                current += character
                if character == ";" and sqlite3.complete_statement(current):
                    statements.append(current)
                    current = ""
            if current.strip():
                statements.append(current)
            rows = []
            for statement in statements:
                cursor = database.execute(statement, fixture.get("params", {}))
                if cursor.description:
                    rows = [dict(row) for row in cursor.fetchall()]
            if fixture.get("inspect"):
                rows = [dict(row) for row in database.execute(fixture["inspect"])]
            return json.dumps(rows)
        finally:
            database.close()
    namespace = {"__name__": "academy_solution"}
    exec(compile(__source, "solution.py", "exec"), namespace)
    if globals().get("__json_function") in ("fastapi", "asgi"):
        app = namespace.get("app")
        if app is None:
            raise RuntimeError("Define the FastAPI application app and POST /solve.")
        async with (app.router.lifespan_context(app) if __mode == "fastapi" else academy_empty_lifespan(app)):
            response = await academy_http(app, {"method": "POST", "url": "/solve", "json": fixture})
        if response["status"] != 200:
            raise RuntimeError("POST /solve must return HTTP 200: " + json.dumps(response))
        return json.dumps(response["json"], allow_nan=False)
    if __mode in ("fastapi", "asgi"):
        app = namespace.get("app")
        if app is None:
            raise RuntimeError("Export a FastAPI application named app.")
        async with (app.router.lifespan_context(app) if __mode == "fastapi" else academy_empty_lifespan(app)):
            if "websocket" in fixture:
                result = await academy_websocket(app, fixture["websocket"])
            else:
                result = [await academy_http(app, request) for request in fixture.get("requests", [])]
        return json.dumps(result)
    if isinstance(fixture, dict) and "__modelProbe" in fixture and "Request" in namespace:
        from pydantic import ValidationError
        probe = fixture["__modelProbe"]
        model = namespace["Request"].model_validate(probe["data"])
        second = namespace["Request"].model_validate(probe["data"])
        frozen = False
        try:
            setattr(model, probe["field"], probe["value"])
        except ValidationError as error:
            frozen = error.errors()[0]["type"] == "frozen_instance"
        model.scopes.append("probe")
        return json.dumps({"frozen": frozen, "independent_defaults": second.scopes == []})
    if not callable(namespace.get("solve")):
        raise RuntimeError("Define solve(input).")
    original = copy.deepcopy(fixture)
    result = namespace["solve"](fixture)
    if inspect.isawaitable(result):
        result = await result
    if fixture != original:
        raise RuntimeError("solve(input) must preserve the caller's input. Copy mutable arrays and objects before changing them.")
    return json.dumps(result, allow_nan=False)

await academy_run()
