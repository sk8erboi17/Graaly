def solve(input):
    counts = {}
    for event in input["events"]:
        if event["kind"] == "join":
            counts[event["player"]] = get(counts, event["player"], 0) + 1
    out = []
    for player in sort_fields(keys(counts)):
        out.append({"player": player, "joins": counts[player]})
    return out
