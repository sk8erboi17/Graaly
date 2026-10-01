def solve(input):
    matches = []
    for command in input["commands"]:
        if command.startswith(input["prefix"]) and command not in matches:
            matches.append(command)
    return sort_fields(matches)[:input["limit"]]
