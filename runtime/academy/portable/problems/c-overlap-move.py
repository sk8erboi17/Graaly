def solve(input):
    destination, source, count = input["destination"], input["source"], input["count"]
    if destination + count > 10 or source + count > 10:
        return 0
    bytes = list(range(10))
    temporary = bytes[source:source + count]
    for index in range(count):
        bytes[destination + index] = temporary[index]
    checksum = 0
    for index in range(10):
        checksum += bytes[index] * (index + 1)
    return checksum
