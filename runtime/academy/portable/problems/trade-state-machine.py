def solve(input):
    revision = 0
    status = "open"
    accepted = []
    for event in input["events"]:
        if status != "open":
            continue
        if event["kind"] == "edit":
            revision += 1
            accepted = []
        elif event["kind"] == "cancel":
            status = "cancelled"
        elif event["kind"] == "accept" and event["revision"] == revision and event["player"] in input["parties"]:
            if event["player"] not in accepted:
                accepted.append(event["player"])
            complete = True
            for player in input["parties"]:
                complete = complete and player in accepted
            if complete:
                status = "committed"
    ordered = []
    for player in input["parties"]:
        if player in accepted:
            ordered.append(player)
    return {"revision": revision, "status": status, "accepted": ordered}
