def solve(input):
    active = {}
    cancelled = []
    for event in input["events"]:
        if event["kind"] == "start":
            active[event["id"]] = event["session"]
        elif event["kind"] == "finish":
            delete_key(active, event["id"])
        else:
            for identifier in keys(active):
                if active[identifier] == event["session"]:
                    cancelled.append(identifier)
                    delete_key(active, identifier)
    return {"cancelled": cancelled, "active": keys(active)}
