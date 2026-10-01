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
    progress = 0 if props["total"] <= 0 else max(0, min(1, props["done"] / props["total"]))
    return select_paths({"bossBar": {"progress": progress, "text": str(props["done"]) + " / " + str(props["total"])}}, input["paths"])
