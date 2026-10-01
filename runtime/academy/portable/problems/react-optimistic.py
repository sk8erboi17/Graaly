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
    count = 0
    props = input["props"]
    for action in input["actions"]:
        if action["kind"] == "rerender":
            props = action["props"]
        elif action["kind"] == "click" and action["slot"] == 0 and props["accepted"]:
            count += 1
    return select_paths({"inventory": native_inventory(str(count), [native_item(0, "EMERALD", "Buy", 1)])}, input["paths"])
