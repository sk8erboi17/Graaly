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

def response(status, value):
    return {"status": status, "json": value}

def route(request, path, method):
    if url_path(get(request, "url", "/")) != path:
        return response(404, {"detail": "Not Found"})
    if get(request, "method", "GET") != method:
        return response(405, {"detail": "Method Not Allowed"})
    return None

def request_headers(request):
    out = {}
    values = get(request, "headers", {})
    for key in keys(values):
        out[key.lower()] = values[key]
    return out

def body_errors(errors):
    out = []
    for item in errors:
        out.append(error(["body"] + item["loc"], item["type"]))
    return {"status": 422, "errors": out}

def solve(input):
    out = []
    socket = input["websocket"]
    if url_path(socket["url"]) != "/v1/ws":
        return [{"close": 1000}]
    for message in socket["messages"]:
        out.append({"echo": message})
    return out
