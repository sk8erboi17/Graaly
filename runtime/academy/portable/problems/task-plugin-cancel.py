def solve(input):
    next = 1
    now = 0
    active = True
    out = []
    for action in input["actions"]:
        now = get(action, "tick", now)
        while active and next <= now:
            out.append(["broadcast", "Pulse"])
            next += 2
        if action["kind"] == "disable":
            active = False
    return out
