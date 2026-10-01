def solve(input):
    parts = []
    for key in sort_fields(keys(input["params"])):
        value = input["params"][key]
        if value is None:
            continue
        values = value if is_list(value) else [value]
        for item in values:
            parts.append(uri_component(key) + "=" + uri_component(item))
    return "&".join(parts)
