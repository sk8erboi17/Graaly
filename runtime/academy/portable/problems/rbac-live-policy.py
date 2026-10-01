def solve(input):
    allowed = unique(input["initial"])
    results = []
    for event in input["events"]:
        if event["kind"] == "grant":
            if event["permission"] not in allowed:
                allowed.append(event["permission"])
        elif event["kind"] == "revoke":
            if event["permission"] in allowed:
                allowed.remove(event["permission"])
        else:
            results.append(event["permission"] in allowed)
    return results
