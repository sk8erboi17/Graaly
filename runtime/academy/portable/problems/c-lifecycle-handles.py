def solve(input):
    owned = []
    for handle in input:
        if handle != 0 and handle not in owned:
            owned.append(handle)
    return len(owned)
