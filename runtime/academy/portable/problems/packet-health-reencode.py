def solve(input):
    out = []
    for action in input["actions"]:
        if action["kind"] != "packet" or get(action, "direction") != "send" or action["name"] != "Play.Server.UPDATE_HEALTH":
            continue
        health = max(0, min(20, action["data"]["health"]))
        if health != action["data"]["health"]:
            data = clone(action["data"])
            data["health"] = health
            out.append(["packet.reencode", action["name"], data])
    return out
