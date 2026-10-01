def solve(input):
    available = 0
    for slot in input["slots"]:
        if slot and slot["type"] == input["type"]:
            available += slot["amount"]
    if available < input["amount"]:
        return {"ok": False, "slots": input["slots"]}
    left = input["amount"]
    slots = clone(input["slots"])
    for index in range(len(slots)):
        slot = slots[index]
        if slot and slot["type"] == input["type"]:
            amount = min(left, slot["amount"])
            left -= amount
            if amount == slot["amount"]:
                slots[index] = None
            else:
                slot["amount"] -= amount
    return {"ok": True, "slots": slots}
