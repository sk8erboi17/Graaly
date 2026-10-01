def solve(input):
    valid = {}
    errors = []
    for name in keys(input["values"]):
        value = input["values"][name]
        if name not in input["available"]:
            errors.append(name + ":unsupported")
        elif not is_number(value) or value < input["bounds"][name][0] or value > input["bounds"][name][1]:
            errors.append(name + ":range")
        else:
            valid[name] = value
    return {"valid": valid, "errors": errors}
