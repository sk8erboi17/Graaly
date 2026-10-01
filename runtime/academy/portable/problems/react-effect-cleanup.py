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
    props = input["props"]
    active = 1
    for action in input["actions"]:
        if action["kind"] == "rerender":
            next = action["props"]
            if next["channel"] != props["channel"]:
                active -= 1
                active += 1
            props = next
    return select_paths({"tab": {"header": str(active), "footer": props["channel"]}}, input["paths"])
