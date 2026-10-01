def solve(input):
    if not input["capacity"]:
        return -1
    length = byte_length(input["text"])
    return length if length < input["capacity"] else -1
