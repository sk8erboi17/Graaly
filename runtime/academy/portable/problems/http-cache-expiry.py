def solve(input):
    cache = {}
    reads = []
    for event in input["events"]:
        if event["kind"] == "put":
            before = get(cache, event["key"])
            if not before or event["revision"] >= before["revision"]:
                cache[event["key"]] = {"value": event["value"], "revision": event["revision"], "expires": event["now"] + event["ttl"]}
        else:
            item = get(cache, event["key"])
            reads.append(item["value"] if item and event["now"] < item["expires"] else None)
    return reads
