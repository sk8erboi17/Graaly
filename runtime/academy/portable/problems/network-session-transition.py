def solve(input):
    state = "disconnected"
    attempts = 0
    for event in input["events"]:
        if event == "connect" and state in ["disconnected", "backoff"]:
            state = "connecting"
        elif event == "open" and state == "connecting":
            state = "open"
            attempts = 0
        elif event == "error" and state in ["connecting", "open"]:
            state = "backoff"
            attempts += 1
        elif event == "close":
            state = "disconnected"
    return {"state": state, "attempts": attempts}
