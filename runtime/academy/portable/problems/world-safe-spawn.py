def solve(input):
    for y in range(len(input["blocks"]) - 3, -1, -1):
        if input["blocks"][y] == "SOLID" and input["blocks"][y + 1] == "AIR" and input["blocks"][y + 2] == "AIR":
            return y + 1 + input["minY"]
    return None
