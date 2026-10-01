def solve(input):
    if input["kind"] == 0:
        return input["value"]["count"]
    if input["kind"] == 1:
        return input["value"]["coordinate"]
    return -1
