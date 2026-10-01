def solve(input):
    token = 0
    value = None
    accepted = []
    for event in input["events"]:
        if event["kind"] == "acquire":
            token = max(token, event["token"])
        elif event["token"] == token:
            value = event["value"]
            accepted.append(event["id"])
    return {"token": token, "value": value, "accepted": accepted}
