def stable(value):
    if is_list(value):
        out = []
        for item in value:
            out.append(stable(item))
        return out
    if is_object(value):
        out = {}
        for key in sort_fields(keys(value)):
            out[key] = stable(value[key])
        return out
    return value

def solve(input):
    return json_text([input["resource"], stable(input["params"])])
