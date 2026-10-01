def solve(input):
    """Execute a parameterized query against a private, real SQLite database."""
    schema = 'CREATE TABLE players(id INTEGER PRIMARY KEY, name TEXT NOT NULL, coins INTEGER NOT NULL CHECK(coins>=0));\nCREATE TABLE items(sku TEXT PRIMARY KEY, price INTEGER NOT NULL, stock INTEGER NOT NULL CHECK(stock>=0));\nCREATE TABLE orders(id INTEGER PRIMARY KEY, player_id INTEGER REFERENCES players(id), sku TEXT, quantity INTEGER NOT NULL, total INTEGER NOT NULL, created INTEGER NOT NULL);\nCREATE TABLE ledger(id INTEGER PRIMARY KEY, player_id INTEGER REFERENCES players(id), delta INTEGER NOT NULL);\nCREATE TABLE outbox(id INTEGER PRIMARY KEY, aggregate_id TEXT, seq INTEGER, delivered INTEGER NOT NULL DEFAULT 0);\nCREATE TABLE memberships(player_id INTEGER REFERENCES players(id), party TEXT, UNIQUE(player_id,party));'
    query = 'SELECT name,coins,DENSE_RANK() OVER(ORDER BY coins DESC) AS rank FROM players ORDER BY coins DESC,name;\n'
    return sql_rows(input, schema, query)
