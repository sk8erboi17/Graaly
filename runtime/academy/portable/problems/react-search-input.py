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
    query = ""
    props = input["props"]
    for action in input["actions"]:
        if action["kind"] == "submit":
            query = action["value"].strip()
        elif action["kind"] == "rerender":
            props = action["props"]
    items = []
    for name in props["names"]:
        if query.lower() in name.lower():
            items.append(native_item(len(items), "BOOK", name, 1))
    state = {"inventory": native_inventory("Search", items), "input": {"id": "search", "open": True, "value": query}}
    return select_paths(state, input["paths"])
