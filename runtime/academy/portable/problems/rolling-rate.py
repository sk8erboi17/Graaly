def solve(input):
    out = []
    for now in input["queries"]:
        count = 0
        for tick in input["events"]:
            if now - input["window"] < tick <= now:
                count += 1
        out.append(count)
    return out
