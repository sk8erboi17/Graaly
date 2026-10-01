def solve(input):
    result = 0
    for byte in input:
        result = (result << 8) | byte
    return result
