def solve(input):
    out = []
    for event in input["events"]:
        if len(out) >= max(0, input["limit"]):
            break
        if event["severity"] >= input["minimum"]:
            out.append(event["id"])
    return out
