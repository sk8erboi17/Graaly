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
    item = native_item(0, "NAME_TAG", "New name", "name.submit", 1, 0, [])
    item["input"] = {"id": "name", "value": "Alex", "placeholder": "New name", "submitActionId": "name.submit", "cancelActionId": "name.cancel"}
    return select_paths(layout_view("html:7f095d67", "Rename", 1, [item], None), input["paths"])
