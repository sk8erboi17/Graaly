def native_item(slot, material, name, amount):
    return {"slot": slot, "material": material, "name": name, "amount": amount, "durability": 0, "lore": []}

def native_inventory(title, items):
    return {"title": title, "rows": 1, "items": items}

def latest_props(input):
    props = input["props"]
    for action in input["actions"]:
        if action["kind"] == "rerender":
            props = action["props"]
    return props

def solve(input):
    failed = input["props"]["fail"]
    for action in input["actions"]:
        if action["kind"] == "rerender":
            failed = failed or action["props"]["fail"]
    return select_paths({"messages": [{"id": "fallback" if failed else "ok", "text": "Unavailable" if failed else "OK"}]}, input["paths"])
