def solve(input):
    seen = []
    matches = []
    for command in input["commands"]:
        key = command["name"].lower()
        if not key.startswith(input["prefix"].lower()) or key in seen:
            continue
        if command["permission"] is not None and command["permission"] not in input["granted"]:
            continue
        seen.append(key)
        matches.append({"key": key, "name": command["name"]})
    out = []
    for command in sort_fields(matches, ["key"])[:max(0, input["limit"])]:
        out.append(command["name"])
    return out
