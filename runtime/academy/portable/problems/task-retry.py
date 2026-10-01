def solve(input):
    out = []
    delay = input["base"]
    for attempt in range(input["attempts"]):
        out.append(min(input["cap"], delay))
        delay = min(input["cap"], delay * 2)
    return out
