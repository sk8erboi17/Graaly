def solve(input):
    value = input["quantity"]
    if not is_integer(value) or value < 1 or value > 64:
        return {"ok": False}
    return {"ok": True, "quantity": value}
