def solve(input):
    width, offset = input["width"], input["offset"]
    if not width or offset >= 32 or width > 32 - offset:
        return input["word"]
    low = (1 << width) - 1
    mask = low << offset
    return (input["word"] & ~mask) | ((input["value"] & low) << offset)
