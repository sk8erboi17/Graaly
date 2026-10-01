def visit(dependencies, visiting, done, identifier):
    if identifier in visiting:
        return True
    if identifier in done:
        return False
    visiting.append(identifier)
    for next in get(dependencies, identifier, []):
        if visit(dependencies, visiting, done, next):
            return True
    visiting.remove(identifier)
    done.append(identifier)
    return False

def solve(input):
    visiting = []
    done = []
    for identifier in keys(input["dependencies"]):
        if visit(input["dependencies"], visiting, done, identifier):
            return True
    return False
