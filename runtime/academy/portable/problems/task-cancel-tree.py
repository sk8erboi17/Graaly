def solve(input):
    edges = {}
    for task in input["tasks"]:
        children = clone(get(edges, task["parent"], []))
        children.append(task["id"])
        edges[task["parent"]] = children
    seen = []
    stack = [input["root"]]
    while stack:
        identifier = stack.pop()
        if identifier in seen:
            continue
        seen.append(identifier)
        stack += get(edges, identifier, [])
    out = []
    for task in input["tasks"]:
        if task["id"] in seen:
            out.append(task["id"])
    return out
