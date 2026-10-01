def solve(input):
    if not input["values"]:
        return None
    values = sort_fields(input["values"])
    rank = max(1, ceil(input["percentile"] / 100 * len(values)))
    return values[min(len(values), rank) - 1]
