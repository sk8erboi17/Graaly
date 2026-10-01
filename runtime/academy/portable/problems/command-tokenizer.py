def solve(input):
    out = []
    token = ""
    quoted = False
    escaped = False
    started = False
    for ch in input["text"]:
        if escaped:
            token += ch
            escaped = False
            started = True
        elif ch == "\\":
            escaped = True
            started = True
        elif ch == '"':
            quoted = not quoted
            started = True
        elif ch in " \t\r\n\v\f" and not quoted:
            if started:
                out.append(token)
            token = ""
            started = False
        else:
            token += ch
            started = True
    if quoted or escaped:
        return None
    if started:
        out.append(token)
    return out
