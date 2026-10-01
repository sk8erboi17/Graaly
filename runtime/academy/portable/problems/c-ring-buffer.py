def solve(input):
    count = input["count"] % input["capacity"]
    return count - (input["capacity"] - input["head"]) if count >= input["capacity"] - input["head"] else input["head"] + count
