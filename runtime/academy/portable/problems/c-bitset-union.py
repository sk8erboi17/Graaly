def solve(input):
    first = bits_op("or", input["a"][0], input["b"][0])
    last = bits_op("or", input["a"][1], input["b"][1])
    last = bits_op("and", last, "0x3f")
    return bits_count(first) + bits_count(last)
