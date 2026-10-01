def solve(input):
    return -(input >> 1) - 1 if input & 1 else input >> 1
