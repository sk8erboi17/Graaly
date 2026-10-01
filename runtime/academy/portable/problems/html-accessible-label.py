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
    visible_text = "→"
    accessible_label = "Teleport home"
    name = accessible_label if accessible_label else visible_text
    item = native_item(0, "COMPASS", name, "go", 1, 0, "Safe destination|Click to travel".split("|"))
    return select_paths(layout_view("labels", "Actions", 1, [item], None), input["paths"])
