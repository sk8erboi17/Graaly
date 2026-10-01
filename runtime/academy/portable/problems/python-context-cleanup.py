def solve(input):
    trace = ["open", "work"]
    if input["fail"]:
        trace.append("close")
        trace.append("handled")
    else:
        trace.append("commit")
        trace.append("close")
    return trace
