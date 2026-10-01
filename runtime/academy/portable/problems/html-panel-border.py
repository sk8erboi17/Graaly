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
    items = []
    rows, columns = 3, 9
    for row in range(rows):
        for column in range(columns):
            slot = row * columns + column
            border = row == 0 or row == rows - 1 or column == 0 or column == columns - 1
            if slot == 13:
                item = native_item(slot, "EMERALD", "OK", "ok", 1, 0, [])
            else:
                item = native_item(slot, "RED_STAINED_GLASS_PANE" if border else "BLUE_STAINED_GLASS_PANE", " ", None, 1, 14 if border else 11, [])
            items.append(item)
    return select_paths(layout_view("html:cc63413c", "Panel", rows, items, None), input["paths"])
