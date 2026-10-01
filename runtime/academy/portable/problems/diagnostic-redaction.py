def redact(value):
    if is_list(value):
        out = []
        for item in value:
            out.append(redact(item))
        return out
    if is_object(value):
        out = {}
        for key in keys(value):
            out[key] = "[REDACTED]" if regex("token|secret|password|authorization", key.lower()) else redact(value[key])
        return out
    return value

def solve(input):
    return redact(input["record"])
