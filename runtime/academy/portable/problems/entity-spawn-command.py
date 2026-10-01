def solve(input):
    out = []
    identifier = 0
    for action in input["actions"]:
        if action["kind"] == "command" and action["name"] == "spawn":
            world = get(input["worlds"], 0)
            if not world:
                out.append(["message", action["sender"], "No world"])
            else:
                identifier += 1
                out.append(["spawn", "COW", {"world": world["name"], "x": 1, "y": 64, "z": 2, "yaw": 0, "pitch": 0}, {}])
                out.append(["entity.customName", identifier, "Academy"])
                out.append(["message", action["sender"], "Spawned"])
    return out
