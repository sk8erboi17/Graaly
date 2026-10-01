def solve(input):
    return {"name": input["name"].strip(), "members": unique(input["members"])}
