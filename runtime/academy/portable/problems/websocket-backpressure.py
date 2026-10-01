def solve(input):
    keep = {}
    index = 0
    for frame in input["frames"]:
        if frame["kind"] == "state":
            keep[frame["channel"]] = index
        index += 1
    out = []
    index = 0
    for frame in input["frames"]:
        if frame["kind"] != "state" or keep[frame["channel"]] == index:
            out.append(frame)
        index += 1
    return out
