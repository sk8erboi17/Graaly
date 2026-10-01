def solve(input):
    distances = {input["start"]: 0}
    done = []
    while True:
        candidate = None
        for identifier in keys(distances):
            if identifier not in done and (candidate is None or distances[identifier] < distances[candidate]):
                candidate = identifier
        if candidate is None:
            return None
        distance = distances[candidate]
        if candidate == input["target"]:
            return distance
        done.append(candidate)
        for edge in input["edges"]:
            if edge["from"] == candidate:
                next = distance + edge["cost"]
                if edge["to"] not in distances or next < distances[edge["to"]]:
                    distances[edge["to"]] = next
