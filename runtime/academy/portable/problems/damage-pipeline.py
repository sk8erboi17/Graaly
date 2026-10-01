def solve(input):
    if input["cancelled"]:
        return 0
    value = input["damage"]
    for modifier in input["modifiers"]:
        value = value + modifier["value"] if modifier["kind"] == "add" else value * modifier["value"]
    return max(0, min(input["cap"], value))
