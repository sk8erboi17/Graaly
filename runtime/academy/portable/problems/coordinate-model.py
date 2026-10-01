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
    world = string_field(errors, input, "world", 1, None)
    value = {"world": world}
    for key in ["x", "y", "z", "yaw"]:
        if key not in input and key != "yaw":
            errors.append(error([key], "missing"))
            continue
        number = get(input, key, 0)
        if not is_number(number):
            if is_string(number) and regex("^[+-]?[0-9]+([.][0-9]+)?$", number):
                number = float(number)
            else:
                errors.append(error([key], "float_parsing" if is_string(number) else "float_type"))
                continue
        minimum = -64 if key == "y" else -30000000
        maximum = 320 if key == "y" else 30000000
        if key != "yaw" and number < minimum:
            errors.append(error([key], "greater_than_equal"))
        elif key != "yaw" and number > maximum:
            errors.append(error([key], "less_than_equal"))
        value[key] = number % 360 if key == "yaw" else number
    return outcome(errors, value)
