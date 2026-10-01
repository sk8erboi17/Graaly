def solve(input):
    now = 0
    pending = []
    out = []
    for action in input["actions"]:
        now = get(action, "tick", now)
        left = []
        for job in sort_fields(pending, ["at"]):
            if job["at"] <= now:
                out.append(["message", job["player"], "Pong"])
            else:
                left.append(job)
        pending = left
        if action["kind"] == "command" and action["name"] == "ping":
            out.append(["message", action["sender"], "Queued"])
            pending.append({"at": now + 3, "player": action["sender"]})
    return out
