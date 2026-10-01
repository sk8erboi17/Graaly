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
    row_start, column_start, row_end, column_end = 2, 4, 3, 7
    items = []
    for row in range(row_start, row_end):
        for column in range(column_start, column_end):
            slot = (row - 1) * 9 + column - 1
            label = "Area" if column == (column_start + column_end) // 2 else " "
            items.append(native_item(slot, "BOOK", label, "area", 1, 0, []))
    return select_paths(layout_view("html:b7bc1a79", "Area", 3, items, None), input["paths"])
