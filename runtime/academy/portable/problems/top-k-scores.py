def solve(input):
    out = []
    for player in sort_fields(input["players"], ["score:desc", "name"])[:max(0, input["k"])]:
        out.append(player["name"])
    return out
