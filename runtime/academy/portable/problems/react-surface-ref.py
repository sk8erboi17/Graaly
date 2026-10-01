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
    visible = True
    for action in input["actions"]:
        if action["kind"] == "click" and action["slot"] == 0:
            visible = False
    inventory = native_inventory("Ref", [native_item(0, "BARRIER", "Dismiss", 1)]) if visible else None
    return select_paths({"inventory": inventory, "tab": {"header": "Still mounted"}}, input["paths"])
