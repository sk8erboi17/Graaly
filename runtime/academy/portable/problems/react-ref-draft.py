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
    pending = 0
    saved = 0
    for action in input["actions"]:
        if action["kind"] == "click" and action["slot"] == 0:
            pending += 1
        elif action["kind"] == "click" and action["slot"] == 1:
            saved += pending
            pending = 0
    items = [native_item(0, "STONE", "Queue", 1), native_item(1, "EMERALD", "Commit", 1)]
    return select_paths({"inventory": native_inventory(str(saved), items)}, input["paths"])
