def solve(input):
    out = []
    for action in input["actions"]:
        if action["kind"] == "event" and action["name"] == "AsyncPlayerChatEvent":
            out.append(["message", action["player"], "Echo: " + action["data"]["message"]])
    return out
