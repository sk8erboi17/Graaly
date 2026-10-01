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
    lines = []
    for member in props["members"]:
        lines.append({"id": member["id"], "text": member["name"] + ": " + str(member["score"])})
    return select_paths({"scoreboard": {"title": "Party", "lines": lines}}, input["paths"])
