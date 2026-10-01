def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'name': 'AcademyBridge',
     'version': '1',
     'main': 'main.mjs',
     'depend': ['PacketEvents'],
     'softdepend': ['Vault'],
     'loadbefore': ['AcademyConsumer'],
     'commands': {'bridge': {'permission': 'academy.bridge'}}}
    return select_paths(document, input["paths"])
