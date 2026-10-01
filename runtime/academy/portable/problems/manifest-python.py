def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'name': 'AcademyPython',
     'version': '2.0',
     'main': 'main.py',
     'description': 'Python party service',
     'authors': ['Alex', 'Sam'],
     'commands': {'party': {'usage': '/party'}}}
    return select_paths(document, input["paths"])
