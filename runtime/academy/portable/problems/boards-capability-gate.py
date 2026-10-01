def solve(input):
    out = []
    for request in input["requests"]:
        result = {"id": request["id"], "ok": False, "reason": "experimental"} if request["surface"] == "board" else {"id": request["id"], "ok": True} if request["surface"] in input["available"] else {"id": request["id"], "ok": False, "reason": "unsupported"}
        out.append(result)
    return out
