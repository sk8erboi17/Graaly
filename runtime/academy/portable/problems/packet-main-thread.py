def solve(input):
    out = []
    for action in input["actions"]:
        if action["kind"] == "packet" and action["name"] == "Play.Client.CHAT_MESSAGE" and get(action, "player"):
            out.append(["message", action["player"], "Packet received"])
    return out
