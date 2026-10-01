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
    count = input["props"]["initial"]
    for action in input["actions"]:
        if action["kind"] == "click" and action["slot"] == 0:
            count += 2
    return select_paths({"inventory": native_inventory("Batch", [native_item(0, "STONE", str(count), 1)])}, input["paths"])
