def solve(input):
    min_x = floor(min(input["a"][0], input["b"][0]) / 16)
    max_x = floor(max(input["a"][0], input["b"][0]) / 16)
    min_z = floor(min(input["a"][1], input["b"][1]) / 16)
    max_z = floor(max(input["a"][1], input["b"][1]) / 16)
    out = []
    for x in range(min_x, max_x + 1):
        for z in range(min_z, max_z + 1):
            out.append([x, z])
    return out
