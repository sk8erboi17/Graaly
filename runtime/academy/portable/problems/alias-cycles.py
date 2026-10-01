def solve(input):
    out = []
    for name in input["names"]:
        seen = []
        while name in input["aliases"]:
            if name in seen:
                name = None
                break
            seen.append(name)
            name = input["aliases"][name]
        out.append(name)
    return out
