def solve(input):
    reason = None
    total = input["quantity"] * input["price"]
    if not input["allowed"]:
        reason = "denied"
    elif not is_integer(input["quantity"]) or input["quantity"] <= 0:
        reason = "quantity"
    elif input["quantity"] > input["stock"]:
        reason = "stock"
    elif total > input["coins"]:
        reason = "coins"
    if reason is not None:
        return {"ok": False, "reason": reason, "coins": input["coins"], "stock": input["stock"]}
    return {"ok": True, "total": total, "coins": input["coins"] - total, "stock": input["stock"] - input["quantity"]}
