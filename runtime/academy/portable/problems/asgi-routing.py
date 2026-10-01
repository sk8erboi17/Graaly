def solve(input):
    out = []
    for request in input["requests"]:
        found = get(request, "method", "GET") == "GET" and request["url"].split("?")[0] == "/health"
        out.append({"status": 200 if found else 404, "json": {"ok": True} if found else {"error": "not_found"}})
    return out
