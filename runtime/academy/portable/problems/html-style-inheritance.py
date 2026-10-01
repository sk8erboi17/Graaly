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
    inherited = "&e&l"
    items = [native_item(0, "STONE_BUTTON", inherited + "Buy", "buy", 1, 0, []), native_item(1, "PAPER", inherited + "&o" + "ready".upper(), None, 1, 0, [])]
    return select_paths(layout_view("html:1f76f02d", "Styles", 1, items, None), input["paths"])
