def solve(input):
    best = -1
    result = False
    for rule in input["rules"]:
        wildcard = rule["node"].endswith(".*")
        prefix = rule["node"][:-1] if wildcard else ""
        matches = rule["node"] == "*" or rule["node"] == input["node"] or (wildcard and input["node"].startswith(prefix))
        if not matches:
            continue
        rank = 0 if rule["node"] == "*" else len(prefix.split(".")) * 2 if wildcard else len(input["node"].split(".")) * 2 + 1
        if rank > best:
            best = rank
            result = rule["allow"]
        elif rank == best:
            result = result and rule["allow"]
    return result
