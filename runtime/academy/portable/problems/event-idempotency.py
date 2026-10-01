def solve(input):
    last = {}
    accepted = []
    index = 0
    for event in input["events"]:
        if event["id"] not in last or event["at"] - last[event["id"]] >= input["ttl"]:
            accepted.append(index)
            last[event["id"]] = event["at"]
        index += 1
    return accepted
