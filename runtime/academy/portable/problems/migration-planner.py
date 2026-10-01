def solve(input):
    done = unique(input["applied"])
    left = clone(input["migrations"])
    plan = []
    while left:
        index = -1
        for i in range(len(left)):
            migration = left[i]
            ready = migration["id"] not in done
            for parent in migration["parents"]:
                ready = ready and parent in done
            if ready:
                index = i
                break
        if index < 0:
            for migration in left:
                if migration["id"] not in done:
                    return None
            return plan
        migration = left.pop(index)
        done.append(migration["id"])
        plan.append(migration["id"])
    return plan
