import os
import sqlite3
from pathlib import Path

def run_migration(cursor: sqlite3.Cursor, sql: str):
    # Split on semicolons but ignore semicolons inside quotes
    statements = []
    current_statement = []
    in_quotes = False
    quote_char = None

    for char in sql:
        if char in ["'", '"'] and (not quote_char or char == quote_char):
            in_quotes = not in_quotes
            quote_char = char if in_quotes else None
        elif char == ';' and not in_quotes:
            current_statement.append(char)
            stmt = ''.join(current_statement).strip()
            if stmt:
                statements.append(stmt)
            current_statement = []
        else:
            current_statement.append(char)

    # Add the last statement if it exists
    stmt = ''.join(current_statement).strip()
    if stmt:
        statements.append(stmt)

    # Execute each statement
    for statement in statements:
        if statement.strip():
            cursor.execute(statement)

def migrate():
    # Get the directory containing this script
    current_dir = Path(__file__).parent
    migrations_dir = current_dir / 'migrations'
    db_path = current_dir / 'database.sqlite'

    print('Running migrations...')

    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Get all .sql files and sort them
        migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

        for file in migration_files:
            print(f'Running migration: {file}')
            with open(migrations_dir / file, 'r') as f:
                sql = f.read()
                run_migration(cursor, sql)

        conn.commit()
        print('Migrations complete!')

    except Exception as e:
        conn.rollback()
        print(f'Error running migrations: {e}')
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
