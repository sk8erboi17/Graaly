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
    page = 0
    props = input["props"]
    for action in input["actions"]:
        if action["kind"] == "rerender":
            props = action["props"]
        elif action["kind"] == "click" and action["slot"] == 8:
            page = min(max(0, ceil(len(props["names"]) / 3) - 1), page + 1)
    items = []
    for name in props["names"][page * 3:page * 3 + 3]:
        items.append(native_item(len(items), "BOOK", name, 1))
    items.append(native_item(8, "ARROW", "Next", 1))
    return select_paths({"inventory": native_inventory("Page " + str(page), items)}, input["paths"])
