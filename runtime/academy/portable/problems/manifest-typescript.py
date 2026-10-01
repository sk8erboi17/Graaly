def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'name': 'AcademyShop',
     'version': '1.0.0',
     'main': 'dist/main.mjs',
     'commands': {'shop': {'description': 'Open the shop',
                           'usage': '/shop [page]',
                           'aliases': ['store']}}}
    return select_paths(document, input["paths"])
