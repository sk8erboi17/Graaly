def solve(input):
    claims = input["claims"]
    if claims["issuer"] != input["issuer"] or claims["audience"] != input["audience"] or claims["expires"] <= input["now"]:
        return {"ok": False, "reason": "identity"}
    if input["scope"] not in claims["scopes"]:
        return {"ok": False, "reason": "scope"}
    return {"ok": True, "subject": claims["subject"]}
