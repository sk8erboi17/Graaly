def solve(input):
    out = []
    for item in input["items"]:
        out.append({"id": item["id"], "value": item["value"] * 2})
    return out
