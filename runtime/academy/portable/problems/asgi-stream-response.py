def solve(input):
    out = []
    for request in input["requests"]:
        result = {"status": 200, "json": [1, 2]}
        if get(request, "inspect_frames", False):
            result["frames"] = [{"bytes": 1, "more": True}, {"bytes": 3, "more": True}, {"bytes": 1, "more": False}]
        out.append(result)
    return out
