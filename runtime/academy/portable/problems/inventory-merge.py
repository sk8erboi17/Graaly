def solve(input):
    slots = clone(input["slots"])
    left = input["item"]["amount"]
    for slot in slots:
        if slot and slot["type"] == input["item"]["type"] and slot["meta"] == input["item"]["meta"]:
            amount = min(left, input["limit"] - slot["amount"])
            if amount > 0:
                slot["amount"] += amount
                left -= amount
    for index in range(len(slots)):
        if slots[index] is None and left:
            amount = min(left, input["limit"])
            item = clone(input["item"])
            item["amount"] = amount
            slots[index] = item
            left -= amount
    return {"slots": slots, "left": left}
