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
    selected = None
    props = input["props"]
    for action in input["actions"]:
        if action["kind"] == "rerender":
            props = action["props"]
        elif action["kind"] == "click" and 0 <= action["slot"] < len(props["names"]):
            selected = action["slot"]
    items = []
    for index in range(len(props["names"])):
        items.append(native_item(index, "EMERALD" if selected == index else "STONE", props["names"][index], 1))
    return select_paths({"inventory": native_inventory("Select", items)}, input["paths"])
