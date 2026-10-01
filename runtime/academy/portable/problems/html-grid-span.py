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
    row, column, width = 2, 3, 3
    items = []
    for offset in range(width):
        slot = (row - 1) * 9 + column - 1 + offset
        label = "Claim" if offset == width // 2 else " "
        items.append(native_item(slot, "EMERALD", label, "claim", 1, 0, []))
    return select_paths(layout_view("html:b8c6fd86", "Claim", 3, items, None), input["paths"])
