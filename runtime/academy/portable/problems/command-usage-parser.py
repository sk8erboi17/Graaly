def solve(input):
    text = input["value"].strip()
    if not regex("^[+]?[0-9]+$", text):
        return {"ok": False, "error": "syntax"}
    digits = text[1:] if text.startswith("+") else text
    while len(digits) > 1 and digits[0] == "0":
        digits = digits[1:]
    if len(digits) > 16 or (len(digits) == 16 and digits > "9007199254740991"):
        return {"ok": False, "error": "range"}
    value = int(text)
    if not is_integer(value) or value > 9007199254740991 or value < input["min"] or value > input["max"]:
        return {"ok": False, "error": "range"}
    return {"ok": True, "value": value}
