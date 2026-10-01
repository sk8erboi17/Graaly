def solve(input):
    out = []
    for request in input["requests"]:
        body = "".join(request["chunks"]) if "chunks" in request else get(request, "body", "")
        out.append({"status": 200, "json": {"bytes": byte_length(body), "text": body}})
    return out
