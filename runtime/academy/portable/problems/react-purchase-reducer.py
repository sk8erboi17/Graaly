def native_item(slot, material, name, amount):
    return {"slot": slot, "material": material, "name": name, "amount": amount, "durability": 0, "lore": []}

def native_inventory(title, items):
    return {"title": title, "rows": 1, "items": items}

def latest_props(input):
    props = input["props"]
    for action in input["actions"]:
        if action["kind"] == "rerender":
            props = action["props"]
    return props

def solve(input):
    props = input["props"]
    coins = props["coins"]
    bought = 0
    for action in input["actions"]:
        if action["kind"] == "rerender":
            props = action["props"]
        elif action["kind"] == "click" and action["slot"] == 0 and coins >= props["price"]:
            coins -= props["price"]
            bought += 1
    return select_paths({"inventory": native_inventory("Coins " + str(coins), [native_item(0, "EMERALD", str(bought), 1)])}, input["paths"])
