def solve(input):
    best = []
    for capacity in range(input["capacity"] + 1):
        best.append(0)
    for item in input["items"]:
        for capacity in range(input["capacity"], item["size"] - 1, -1):
            best[capacity] = max(best[capacity], best[capacity - item["size"]] + item["value"])
    return best[input["capacity"]]
