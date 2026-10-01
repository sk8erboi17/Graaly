def solve(input):
    events = clone(input["events"])
    for event in events:
        event["epoch"] = epoch(event["at"])
    out = []
    for event in sort_fields(events, ["epoch"]):
        out.append(event["id"])
    return out
