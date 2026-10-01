def solve(input):
    position = input["roll"]
    for item in input["items"]:
        if item["weight"] <= 0:
            continue
        if position < item["weight"]:
            return item["id"]
        position -= item["weight"]
    return None
