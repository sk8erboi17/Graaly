def solve(input):
    players = {}
    for player in input["players"]:
        players[player["name"]] = player
    welcomed = []
    out = []
    for action in input["actions"]:
        if action["kind"] == "event" and action["name"] == "PlayerJoinEvent":
            player = get(players, action["player"])
            if not player:
                continue
            identifier = get(player, "uniqueId", player["name"])
            if not get(player, "hasPlayedBefore", False) and identifier not in welcomed:
                welcomed.append(identifier)
                out.append(["message", player["name"], "Welcome " + player["name"]])
    return out
