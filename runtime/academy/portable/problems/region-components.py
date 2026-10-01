def find(parent, index):
    while parent[index] != index:
        parent[index] = parent[parent[index]]
        index = parent[index]
    return index

def solve(input):
    parent = list(range(len(input["ids"])))
    index = {}
    for i in range(len(input["ids"])):
        index[input["ids"][i]] = i
    for link in input["links"]:
        a, b = link
        if a in index and b in index:
            x = find(parent, index[a])
            y = find(parent, index[b])
            parent[x] = y
    roots = []
    for i in range(len(parent)):
        roots.append(find(parent, i))
    return len(unique(roots))
