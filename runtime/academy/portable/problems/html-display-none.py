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
    declarations = [{"name": "Hidden", "hidden": True, "action": None}, {"name": "First", "hidden": False, "action": "first"}, {"name": "Second", "hidden": False, "action": "second"}]
    items = []
    for declaration in declarations:
        if not declaration["hidden"]:
            items.append(native_item(len(items), "STONE_BUTTON", declaration["name"], declaration["action"], 1, 0, []))
    return select_paths(layout_view("menu", "Menu", 1, items, None), input["paths"])
