def solve(input):
    out = []
    for span in input["spans"]:
        children = 0
        for child in input["spans"]:
            if child["parent"] == span["id"]:
                children += child["end"] - child["start"]
        out.append({"id": span["id"], "exclusive": max(0, span["end"] - span["start"] - children)})
    return out
