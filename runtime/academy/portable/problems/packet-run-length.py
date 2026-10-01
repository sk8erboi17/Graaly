def solve(input):
    runs = []
    for value in input["values"]:
        last = get(runs, -1)
        if last and last["value"] == value:
            last["count"] += 1
        else:
            runs.append({"value": value, "count": 1})
    return runs
