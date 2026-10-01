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
    initiator = string_field(errors, input, "initiator", 1, None)
    recipient = string_field(errors, input, "recipient", 1, None)
    coins = integer_field(errors, input, "coins", 0, None, 0, False)
    items = []
    for index in range(len(get(input, "items", []))):
        number = input["items"][index]
        if not is_integer(number):
            errors.append(error(["items", index], "int_parsing" if is_string(number) else "int_type"))
        elif number <= 0:
            errors.append(error(["items", index], "greater_than"))
        items.append(number)
    if not errors and (initiator == recipient or (coins == 0 and not items)):
        errors.append(error([], "value_error"))
    return outcome(errors, {"initiator": initiator, "recipient": recipient, "coins": coins, "items": items})
