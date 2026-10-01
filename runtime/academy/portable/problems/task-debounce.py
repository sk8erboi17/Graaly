def solve(input):
    pending = {}
    result = []
    for event in input["events"]:
        for player in keys(pending):
            job = pending[player]
            if job["at"] <= event["tick"]:
                result.append([job["at"], player, job["value"]])
                delete_key(pending, player)
        pending[event["player"]] = {"at": event["tick"] + input["delay"], "value": event["value"]}
    for player in keys(pending):
        job = pending[player]
        if job["at"] <= input["until"]:
            result.append([job["at"], player, job["value"]])
    return sort_fields(result, ["0", "1"])
