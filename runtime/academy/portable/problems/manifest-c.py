def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'name': 'AcademyNative',
     'version': '1.0.0',
     'main': 'dist/plugin.wasm',
     'description': 'Native packet tools',
     'depend': ['PacketEvents'],
     'commands': {'native': {'usage': '/native'}}}
    return select_paths(document, input["paths"])
