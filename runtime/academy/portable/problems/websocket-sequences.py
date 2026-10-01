def solve(input):
    next = input["next"]
    pending = {}
    delivered = []
    for frame in input["frames"]:
        key = str(frame["seq"])
        if frame["seq"] < next or key in pending:
            continue
        pending[key] = frame["value"]
        while str(next) in pending:
            delivered.append(pending[str(next)])
            delete_key(pending, str(next))
            next += 1
    waiting = []
    for key in keys(pending):
        waiting.append(int(key))
    return {"next": next, "delivered": delivered, "pending": sort_fields(waiting)}
