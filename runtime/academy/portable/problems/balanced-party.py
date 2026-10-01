def solve(input):
    total = sum(input["weights"])
    sums = [0]
    for weight in input["weights"]:
        next = clone(sums)
        for value in sums:
            if value + weight not in next:
                next.append(value + weight)
        sums = next
    best = total
    for value in sums:
        best = min(best, abs(total - 2 * value))
    return best
