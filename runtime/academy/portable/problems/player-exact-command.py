def solve(input):
    out = []
    for action in input["actions"]:
        if action["kind"] != "command" or action["name"] != "tell":
            continue
        target = None
        for player in input["players"]:
            if get(player, "online", True) and player["name"].lower() == action["args"][0].lower():
                target = player
                break
        if target:
            out.append(["message", target["name"], "Hello"])
            out.append(["message", action["sender"], "Sent"])
        else:
            out.append(["message", action["sender"], "Missing"])
    return out
