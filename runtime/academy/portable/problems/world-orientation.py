def solve(input):
    """Yaw wraps; pitch clamps. These operations describe different constraints."""
    return {"yaw": input["yaw"] % 360, "pitch": max(-90, min(90, input["pitch"]))}
