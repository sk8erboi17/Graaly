def solve(input):
    out = []
    for action in input["actions"]:
        if action["kind"] == "packet" and action["name"] == "Play.Client.CHAT_MESSAGE" and "spam" in action["data"]["message"].lower():
            out.append(["packet.cancel", action["name"], True])
    return out
