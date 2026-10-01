def solve(input):
    for field in ["tag", "counter", "code"]:
        if input["a"][field] != input["b"][field]:
            return 0
    return 1
