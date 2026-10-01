def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'features': {'packets': True, 'react': True, 'html': True, 'boards': False},
     'limits': {'per_tick': 50, 'session_ttl': 300}}
    return select_paths(document, input["paths"])
