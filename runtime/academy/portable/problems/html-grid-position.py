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
    row, column = 2, 5
    slot = (row - 1) * 9 + column - 1
    items = [native_item(slot, "DIAMOND", "Confirm", "buy", 1, 0, [])]
    return select_paths(layout_view("shop", "Shop", 3, items, None), input["paths"])
