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
    declarations = [{"id": "confirm", "class": "item", "text": "Confirm"}, {"id": "next", "class": "item", "text": "Next"}, {"id": "plain", "class": "", "text": "Plain"}]
    items = []
    for declaration in declarations:
        color = "&9"
        if declaration["class"] == "item":
            color = "&2"
        if declaration["id"] == "confirm":
            color = "&c"
        items.append(native_item(len(items), "STONE_BUTTON", color + declaration["text"], declaration["id"], 1, 0, []))
    return select_paths(layout_view("html:8e2b5505", "Cascade", 1, items, None), input["paths"])
