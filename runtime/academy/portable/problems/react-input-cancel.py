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
    name = input["props"]["name"]
    status = "editing"
    for action in input["actions"]:
        if action["kind"] == "submit":
            name = action["value"]
            status = "saved"
        elif action["kind"] == "cancel":
            status = "cancelled"
    return select_paths({"tab": {"header": name, "footer": status}, "input": {"id": "edit", "open": True, "value": name}}, input["paths"])
