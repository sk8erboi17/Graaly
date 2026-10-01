def solve(input):
    out = []
    for action in input["actions"]:
        if action["kind"] == "command" and action["name"] == "price":
            out.append(["http", "GET", input["url"], None])
            response = input["responses"][input["url"]]
            text = "Price: " + str(response["body"]["price"]) if 200 <= response["status"] < 300 else "Unavailable"
            out.append(["message", action["sender"], text])
    return out
