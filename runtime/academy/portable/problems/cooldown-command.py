def solve(input):
    players = {}
    for player in input["players"]:
        players[player["name"]] = player
    last = {}
    now = 0
    out = []
    for action in input["actions"]:
        now = get(action, "tick", now)
        if action["kind"] != "command" or action["name"] != "heal":
            continue
        name = action["sender"]
        player = get(players, name)
        if not player:
            out.append(["message", name, "Players only"])
        elif "heal.use" not in get(player, "permissions", []) and "*" not in get(player, "permissions", []):
            out.append(["message", name, "Denied"])
        elif name in last and now - last[name] < input["cooldown"]:
            out.append(["message", name, "Cooldown"])
        else:
            last[name] = now
            out.append(["health", name, 20])
            out.append(["message", name, "Healed"])
    return out
