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
    panel_row, panel_column, panel_rows, panel_columns = 2, 3, 2, 4
    button_row, button_column = 2, 2
    button_slot = (panel_row - 1 + button_row - 1) * 9 + panel_column - 1 + button_column - 1
    items = []
    for row in range(panel_rows):
        for column in range(panel_columns):
            slot = (panel_row - 1 + row) * 9 + panel_column - 1 + column
            if slot == button_slot:
                item = native_item(slot, "DIAMOND", "Inner", "inner", 1, 0, [])
            else:
                item = native_item(slot, "BLUE_STAINED_GLASS_PANE", " ", None, 1, 11, [])
            items.append(item)
    return select_paths(layout_view("html:c7999c28", "Nested", 3, items, None), input["paths"])
