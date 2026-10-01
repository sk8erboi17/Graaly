def solve(input):
    width, offset = input["width"], input["offset"]
    if not width or offset >= 64 or width > 64 - offset:
        return 0
    return bits_extract(input["word"], offset, width)
