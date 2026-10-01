def solve(input):
    value = 0
    for index in range(min(len(input), 5)):
        byte = input[index]
        if index == 4 and byte & 240:
            return -1
        value |= (byte & 127) << (7 * index)
        if not byte & 128:
            return value if index + 1 == len(input) else -1
    return -1
