def solve(input):
    if input["diagnostics"]["ok"]:
        return [["log", "info", "Ready"]]
    return [["log", "error", "Contract mismatch"]]
