def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'name': 'AcademyTerrain',
     'version': '1',
     'main': 'main.mjs',
     'load': 'STARTUP',
     'description': 'Deterministic terrain',
     'commands': {'terrain': {'usage': '/terrain <world>'}}}
    return select_paths(document, input["paths"])
