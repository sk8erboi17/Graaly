def solve(input):
    cache = {}
    reads = []
    for event in input["events"]:
        if event["kind"] == "get":
            value = get(cache, event["key"])
            reads.append(value)
            if event["key"] in cache:
                delete_key(cache, event["key"])
                cache[event["key"]] = value
        else:
            delete_key(cache, event["key"])
            if input["capacity"] > 0:
                cache[event["key"]] = event["value"]
                while len(cache) > input["capacity"]:
                    delete_key(cache, keys(cache)[0])
    return {"reads": reads, "keys": keys(cache)}
