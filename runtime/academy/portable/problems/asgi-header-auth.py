def solve(input):
    out = []
    for request in input["requests"]:
        headers = {}
        for key in keys(get(request, "headers", {})):
            headers[key.lower()] = request["headers"][key]
        ok = get(headers, "x-api-key") == "academy"
        out.append({"status": 200 if ok else 401, "json": {"ok": ok}})
    return out
