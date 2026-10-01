def solve(input):
    priorities = ["LOWEST", "LOW", "NORMAL", "HIGH", "HIGHEST", "MONITOR"]
    listeners = clone(input["listeners"])
    for listener in listeners:
        listener["rank"] = priorities.index(listener["priority"])
    cancelled = input["cancelled"]
    ran = []
    for listener in sort_fields(listeners, ["rank"]):
        if cancelled and listener["ignoreCancelled"]:
            continue
        ran.append(listener["id"])
        if "cancel" in listener:
            cancelled = listener["cancel"]
    return {"ran": ran, "cancelled": cancelled}
