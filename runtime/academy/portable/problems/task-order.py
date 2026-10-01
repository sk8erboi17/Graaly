def solve(input):
    out = []
    for task in sort_fields(input["tasks"], ["at"]):
        if task["at"] <= input["until"] and task["id"] not in input["cancelled"]:
            out.append(task["id"])
    return out
