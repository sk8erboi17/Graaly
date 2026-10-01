def solve(input):
    matches = []
    origin = input["origin"]
    for player in input["players"]:
        if player["world"] != origin["world"] or not player["online"]:
            continue
        distance = (player["x"] - origin["x"]) ** 2 + (player["y"] - origin["y"]) ** 2 + (player["z"] - origin["z"]) ** 2
        if distance <= input["radius"] ** 2:
            matches.append({"name": player["name"], "distance": distance})
    out = []
    for player in sort_fields(matches, ["distance", "name"]):
        out.append(player["name"])
    return out
