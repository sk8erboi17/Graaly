def solve(input):
    rows = len(input["grid"])
    cols = len(get(input["grid"], 0, []))
    sx, sy = input["start"]
    tx, ty = input["target"]
    if not rows or not cols or get(get(input["grid"], sy), sx) != 0 or get(get(input["grid"], ty), tx) != 0:
        return -1
    seen = [[sx, sy]]
    queue = [[sx, sy, 0]]
    head = 0
    while head < len(queue):
        x, y, distance = queue[head]
        head += 1
        if x == tx and y == ty:
            return distance
        for delta in [[1, 0], [-1, 0], [0, 1], [0, -1]]:
            a, b = x + delta[0], y + delta[1]
            if 0 <= a < cols and 0 <= b < rows and input["grid"][b][a] == 0 and [a, b] not in seen:
                seen.append([a, b])
                queue.append([a, b, distance + 1])
    return -1
