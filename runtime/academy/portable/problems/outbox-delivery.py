def solve(input):
    pending = {}
    for record in input["records"]:
        pending[record["id"]] = record
    sent = []
    for event in input["events"]:
        if event["kind"] == "flush":
            sent.append(keys(pending))
        elif event["kind"] == "ack" and get(get(pending, event["id"]), "version") == event["version"]:
            delete_key(pending, event["id"])
    return {"sent": sent, "pending": keys(pending)}
