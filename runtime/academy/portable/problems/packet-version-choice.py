def solve(input):
    out = []
    for client in input["clients"]:
        version = client["version"].split(".")
        major, minor = int(version[0]), int(version[1])
        out.append({"id": client["id"], "layout": "modern" if major > 1 or minor >= 19 else "legacy"})
    return out
