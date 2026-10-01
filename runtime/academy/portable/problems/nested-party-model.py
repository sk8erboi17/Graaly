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
    name = string_field(errors, input, "name", 1, None)
    members = []
    seen = []
    values = get(input, "members", [])
    if "members" not in input:
        errors.append(error(["members"], "missing"))
    elif len(values) < 1:
        errors.append(error(["members"], "too_short"))
    elif len(values) > 4:
        errors.append(error(["members"], "too_long"))
    for index in range(len(values)):
        member = values[index]
        local = []
        identifier = integer_field(local, member, "player_id", None, None, None, False)
        if "player_id" in member and identifier <= 0 and not local:
            local.append(error(["player_id"], "greater_than"))
        for item in local:
            errors.append(error(["members", index] + item["loc"], item["type"]))
        seen.append(identifier)
        members.append({"player_id": identifier, "ready": get(member, "ready", False)})
    if not errors and len(unique(seen)) != len(seen):
        errors.append(error([], "value_error"))
    return outcome(errors, {"name": name, "members": members})
