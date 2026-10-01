def solve(input):
    out = []
    for point in input["points"]:
        x, z = point
        out.append({"chunkX": floor(x / 16), "chunkZ": floor(z / 16), "localX": x % 16, "localZ": z % 16})
    return out
