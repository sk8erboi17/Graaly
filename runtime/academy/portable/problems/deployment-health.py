def solve(input):
    failures = []
    for service in input["services"]:
        if not service["ready"] or service["schema"] != input["schema"] or service["contract"] != input["contract"]:
            failures.append(service["id"])
    return {"ready": not failures and len(input["services"]) > 0, "failures": failures}
