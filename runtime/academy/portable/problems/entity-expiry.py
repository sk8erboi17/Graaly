def solve(input):
    out = []
    for entity in input["entities"]:
        if entity["owned"] and entity["expires"] <= input["now"] and entity["id"] not in out:
            out.append(entity["id"])
    return out
