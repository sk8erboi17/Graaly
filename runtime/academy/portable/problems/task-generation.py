def solve(input):
    generation = 0
    value = None
    for event in input["events"]:
        if event["kind"] == "start":
            generation = event["generation"]
        elif event["kind"] == "complete" and event["generation"] == generation:
            value = event["value"]
        elif event["kind"] == "cancel" and event["generation"] == generation:
            generation = -1
    return value
