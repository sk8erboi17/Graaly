def solve(input):
    out = []
    for region in input["regions"]:
        inside = region["world"] == input["world"]
        for index in range(3):
            inside = inside and min(region["a"][index], region["b"][index]) <= input["point"][index] <= max(region["a"][index], region["b"][index])
        if inside and region["owner"] != input["player"] and input["player"] not in region["members"]:
            out.append(region["id"])
    return sort_fields(out)
