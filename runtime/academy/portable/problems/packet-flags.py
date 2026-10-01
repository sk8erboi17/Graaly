def solve(input):
    out = []
    for byte in input["bytes"]:
        out.append({"flying": bool(byte & 2), "canFly": bool(byte & 4), "creative": bool(byte & 8), "invulnerable": bool(byte & 1)})
    return out
