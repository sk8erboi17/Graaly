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
    open = True
    for action in input["actions"]:
        if action["kind"] == "close":
            open = False
    inventory = native_inventory("Menu", [native_item(0, "BOOK", "Menu", 1)]) if open else None
    return select_paths({"tab": {"header": "open" if open else "closed"}, "inventory": inventory}, input["paths"])
