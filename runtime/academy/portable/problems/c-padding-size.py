def solve(input):
    offset = 0
    alignment = 1
    offsets = []
    for field in input["fields"]:
        alignment = max(alignment, field["alignment"])
        offset = ceil(offset / field["alignment"]) * field["alignment"]
        offsets.append(offset)
        offset += field["size"]
    size = ceil(offset / alignment) * alignment
    query = input["query"]
    return size if query == 0 else offsets[1] if query == 1 else offsets[2] if query == 2 else alignment
