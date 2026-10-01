def solve(input):
    committed = []
    for step in input["steps"]:
        if not step["ok"]:
            return {"ok": False, "compensate": list(reversed(committed))}
        committed.append(step["undo"])
    return {"ok": True, "compensate": []}
