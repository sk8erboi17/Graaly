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
    declarations = [{"name": "Large", "id": "large", "amount": 999, "material": "STONE"}, {"name": "Small", "id": "small", "amount": 0, "material": "STONE"}, {"name": "Default", "id": "default", "material": "BOOK"}]
    items = []
    for declaration in declarations:
        items.append(native_item(len(items), declaration["material"], declaration["name"], declaration["id"], get(declaration, "amount", 1), 0, []))
    return select_paths(layout_view("html:3ce2d043", "Stacks", 1, items, None), input["paths"])
