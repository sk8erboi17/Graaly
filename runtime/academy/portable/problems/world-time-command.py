def solve(input):
    players = {}
    for player in input["players"]:
        players[player["name"]] = player
    worlds = []
    for world in input["worlds"]:
        worlds.append(world["name"])
    out = []
    for action in input["actions"]:
        if action["kind"] != "command" or action["name"] != "day":
            continue
        permissions = get(get(players, action["sender"]), "permissions", [])
        if "world.day" not in permissions and "*" not in permissions:
            out.append(["message", action["sender"], "Denied"])
        elif get(action["args"], 0) not in worlds:
            out.append(["message", action["sender"], "Unknown world"])
        else:
            out.append(["world.time", action["args"][0], 0])
            out.append(["message", action["sender"], "Done"])
    return out
