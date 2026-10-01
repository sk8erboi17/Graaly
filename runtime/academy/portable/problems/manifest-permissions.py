def solve(input):
    """Build the required deployment document with native scalar types."""
    document = {'name': 'AcademyPolicy',
     'version': '1',
     'main': 'main.mjs',
     'permissions': {'academy.admin': {'default': 'op',
                                       'children': {'academy.read': True,
                                                    'academy.write': True}},
                     'academy.read': {'default': True},
                     'academy.write': {'default': False}}}
    return select_paths(document, input["paths"])
