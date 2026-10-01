def native_item(slot, material, name, action, amount, durability, lore):
    return {"slot": slot, "material": material, "name": name, "actionId": action, "amount": max(1, min(64, amount)), "durability": durability, "lore": lore}

def layout_view(identifier, title, rows, items, close):
    inventory = {"id": identifier, "title": title, "rows": rows, "items": items}
    if close:
        inventory["closeActionId"] = close
    slots = {}
    for item in items:
        slots[str(item["slot"])] = item
    return {"messages": [], "inventory": inventory, "slots": slots}

def solve(input):
    variables = {"material": "DIAMOND", "count": 3, "lore": "Rare|Keep it"}
    items = [native_item(0, variables["material"], "Reward", "reward", variables["count"], 0, variables["lore"].split("|"))]
    return select_paths(layout_view("html:47c58956", "Rewards", 1, items, None), input["paths"])
