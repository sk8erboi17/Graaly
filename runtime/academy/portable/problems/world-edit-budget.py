def solve(input):
    out = []
    if input["budget"] <= 0:
        return out
    for index in range(0, len(input["edits"]), input["budget"]):
        out.append({"tick": input["start"] + len(out), "edits": input["edits"][index:index + input["budget"]]})
    return out
