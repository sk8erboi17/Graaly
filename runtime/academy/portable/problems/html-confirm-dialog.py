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
    yes = native_item(0, "LIME_STAINED_GLASS_PANE", "Yes", "yes", 1, 5, [])
    no = native_item(1, "RED_STAINED_GLASS_PANE", "No", "no", 1, 14, [])
    view = {"messages": [], "inventory": None, "modal": {"id": "confirm", "title": "Delete?", "closeActionId": "dismiss", "choices": [yes, no]}}
    return select_paths(view, input["paths"])
