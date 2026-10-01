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
    quantity = input["props"]["quantity"]
    for action in input["actions"]:
        if action["kind"] == "click" and action["slot"] == 0:
            change = -1 if get(action, "right", False) else 10 if get(action, "shift", False) else 1
            quantity = max(1, min(64, quantity + change))
    return select_paths({"inventory": native_inventory("Quantity", [native_item(0, "STONE", str(quantity), quantity)])}, input["paths"])
