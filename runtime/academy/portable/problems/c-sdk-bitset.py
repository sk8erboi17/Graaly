def solve(input):
    if input["bits"] > 192:
        return -1
    used = []
    for index in input["indices"]:
        if 0 <= index < input["bits"] and index not in used:
            used.append(index)
    return len(used)
