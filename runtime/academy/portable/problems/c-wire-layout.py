def solve(input):
    bytes = [input["tag"], (input["counter"] >> 24) & 255, (input["counter"] >> 16) & 255, (input["counter"] >> 8) & 255, input["counter"] & 255]
    checksum = 0
    for index in range(len(bytes)):
        checksum += bytes[index] * (index + 1)
    return checksum
