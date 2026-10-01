def solve(input):
    conflicts = []
    for i in range(len(input["bookings"])):
        for j in range(i + 1, len(input["bookings"])):
            a, b = input["bookings"][i], input["bookings"][j]
            if a["start"] < a["end"] and b["start"] < b["end"] and a["start"] < b["end"] and b["start"] < a["end"]:
                conflicts.append([a["id"], b["id"]])
    return conflicts
