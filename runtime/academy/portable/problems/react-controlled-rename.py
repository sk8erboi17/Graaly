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
    name = input["props"]["name"]
    for action in input["actions"]:
        if action["kind"] == "submit" and action["value"].strip():
            name = action["value"].strip()
    return select_paths({"tab": {"header": name, "footer": "Profile"}, "input": {"id": "rename", "open": True, "value": name}}, input["paths"])
