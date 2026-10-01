def solve(input):
    owners = {}
    out = []
    for action in input["actions"]:
        if action["kind"] == "enable" and action["owner"] not in owners:
            owners[action["owner"]] = action["listeners"]
        if action["kind"] == "disable":
            delete_key(owners, action["owner"])
        if action["kind"] == "emit":
            emitted = []
            for owner in keys(owners):
                for listener in owners[owner]:
                    if listener["event"] == action["event"]:
                        emitted.append(owner + ":" + listener["name"])
            out.append(emitted)
    return out
