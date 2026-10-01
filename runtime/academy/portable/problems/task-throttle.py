def solve(input):
    last = {}
    out = []
    for event in input["events"]:
        if event["player"] in last and event["tick"] - last[event["player"]] < input["window"]:
            continue
        last[event["player"]] = event["tick"]
        out.append(event["id"])
    return out
