def error(loc, kind):
    return {"loc": loc, "type": kind}

def string_field(errors, input, name, minimum, maximum):
    if name not in input:
        errors.append(error([name], "missing"))
        return ""
    value = input[name]
    if not is_string(value):
        errors.append(error([name], "string_type"))
        return ""
    if len(value) < minimum:
        errors.append(error([name], "string_too_short"))
    elif maximum is not None and len(value) > maximum:
        errors.append(error([name], "string_too_long"))
    return value

def integer_field(errors, input, name, minimum, maximum, default, strict):
    if name not in input and default is None:
        errors.append(error([name], "missing"))
        return 0
    value = get(input, name, default)
    if strict and not is_integer(value):
        errors.append(error([name], "int_type"))
        return 0
    if not is_integer(value) and value is not True and value is not False:
        if is_string(value) and regex("^[+-]?[0-9]+([.]0+)?$", value.strip()):
            value = int(float(value))
        else:
            kind = "int_parsing" if is_string(value) else "int_from_float" if is_number(value) else "int_type"
            errors.append(error([name], kind))
            return 0
    value = int(value)
    if minimum is not None and value < minimum:
        errors.append(error([name], "greater_than_equal"))
    elif maximum is not None and value > maximum:
        errors.append(error([name], "less_than_equal"))
    return value

def forbid_extra(errors, input, allowed):
    for key in keys(input):
        if key not in allowed:
            errors.append(error([key], "extra_forbidden"))
    return None

def outcome(errors, value):
    return {"ok": False, "errors": errors} if errors else {"ok": True, "value": value}

def solve(input):
    errors = []
    players = []
    if "players" not in input:
        return outcome([error(["players"], "missing")], None)
    if len(input["players"]) > 100:
        errors.append(error(["players"], "too_long"))
    for index in range(len(input["players"])):
        raw = input["players"][index]
        if not is_string(raw):
            errors.append(error(["players", index], "uuid_type"))
            continue
        raw = raw.lower().replace("urn:uuid:", "").replace("{", "").replace("}", "").replace("-", "")
        if not regex("^[0-9a-f]{32}$", raw):
            errors.append(error(["players", index], "uuid_parsing"))
            continue
        canonical = raw[:8] + "-" + raw[8:12] + "-" + raw[12:16] + "-" + raw[16:20] + "-" + raw[20:]
        if canonical not in players:
            players.append(canonical)
    return outcome(errors, {"players": players})
