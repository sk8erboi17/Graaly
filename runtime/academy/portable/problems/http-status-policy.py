def solve(input):
    out = []
    for status in input["statuses"]:
        out.append("success" if 200 <= status < 300 else "retry" if status == 429 or status >= 500 else "auth" if status == 401 or status == 403 else "reject")
    return out
