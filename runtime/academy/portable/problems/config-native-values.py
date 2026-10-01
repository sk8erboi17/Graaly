def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'shop': {'enabled': True, 'max_quantity': 64, 'title': 'Shop: Main'},
     'backend': {'url': 'https://api.example.test', 'timeout_ms': 1500, 'retries': 3}}
    return select_paths(document, input["paths"])
