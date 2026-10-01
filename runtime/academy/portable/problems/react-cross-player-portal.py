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
    props = latest_props(input)
    friend = {"inventory": native_inventory(props["title"], [native_item(0, "BOOK", props["name"], 1)])}
    return select_paths({"tab": {"header": "Owner"}, "inventory": None, "native": {"Friend": friend}}, input["paths"])
