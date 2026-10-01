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
            corner = (row == 0 or row == rows - 1) and (column == 0 or column == columns - 1)
            if corner:
                continue
            border = row == 0 or row == rows - 1 or column == 0 or column == columns - 1
            items.append(native_item(row * columns + column, "RED_STAINED_GLASS_PANE" if border else "BLUE_STAINED_GLASS_PANE", " ", None, 1, 14 if border else 11, []))
    return select_paths(layout_view("round", "Rounded", rows, items, None), input["paths"])
