def solve(input):
    return input // 64 + (1 if input % 64 != 0 else 0)
