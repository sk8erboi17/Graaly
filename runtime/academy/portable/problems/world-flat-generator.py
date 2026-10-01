def solve(input):
    out = []
    for y in input["heights"]:
        block = "OUTSIDE" if y < input["minY"] or y >= input["maxY"] else "BEDROCK" if y == input["minY"] else "STONE" if y < input["surface"] - 3 else "DIRT" if y < input["surface"] else "GRASS_BLOCK" if y == input["surface"] else "AIR"
        out.append(block)
    return out
