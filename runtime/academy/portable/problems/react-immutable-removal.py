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
    names = clone(input["props"]["names"])
    for action in input["actions"]:
        if action["kind"] == "click" and 0 <= action["slot"] < len(names):
            name = names[action["slot"]]
            next = []
            for value in names:
                if value != name:
                    next.append(value)
            names = next
    items = []
    for index in range(len(names)):
        items.append(native_item(index, "BOOK", names[index], 1))
    return select_paths({"inventory": native_inventory("Remove", items)}, input["paths"])
