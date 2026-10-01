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
    raw = str(get(input, "amount", ""))
    if "amount" not in input:
        errors.append(error(["amount"], "missing"))
    elif not regex("^[+-]?[0-9]+([.][0-9]+)?$", raw):
        errors.append(error(["amount"], "decimal_parsing"))
    else:
        parts = raw.split(".")
        fraction = get(parts, 1, "")
        while fraction.endswith("0"):
            fraction = fraction[:-1]
        whole = parts[0].replace("-", "").replace("+", "")
        while whole.startswith("0") and len(whole) > 1:
            whole = whole[1:]
        digits = len(whole) + len(fraction)
        if float(raw) < 0:
            errors.append(error(["amount"], "greater_than_equal"))
        elif digits > 8:
            errors.append(error(["amount"], "decimal_max_digits"))
        elif len(fraction) > 2:
            errors.append(error(["amount"], "decimal_max_places"))
    currency = get(input, "currency", "COIN")
    if currency != "COIN":
        errors.append(error(["currency"], "literal_error"))
    return outcome(errors, {"amount": raw, "currency": currency})
