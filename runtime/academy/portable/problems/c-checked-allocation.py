def solve(input):
    if input["size"] and input["count"] > input["cap"] // input["size"]:
        return -1
    return input["count"] * input["size"]
