import os
import time
import asyncio
from pathlib import Path
from libsql_client import Client, create_client
from dotenv import load_dotenv

async def run_migration(client: Client, sql: str):
    # Split on semicolons but ignore semicolons inside quotes
    statements = []
    current_statement = []
    in_quotes = False
    quote_char = None
    escaped = False

    for char in sql:
        if escaped:
            current_statement.append(char)
            escaped = False
            continue

        if char == '\\':
            escaped = True
            current_statement.append(char)
            continue

        if char in ["'", '"']:
            in_quotes = not in_quotes if not quote_char or char == quote_char else in_quotes
            quote_char = char if in_quotes else None

        if char == ';' and not in_quotes:
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
            # Replace timestamp placeholders with current Unix timestamp
            current_time = int(time.time())
            statement = statement.replace('CURRENT_TIMESTAMP', str(current_time))
            print(f"\nExecuting SQL statement:\n{statement}\n")
            try:
                await client.execute(statement)
                print("Statement executed successfully")
            except Exception as e:
                print(f"Error executing statement: {e}")
                raise

async def migrate():
    # Load environment variables
    load_dotenv()

    # Get Turso credentials from environment
    db_url = os.getenv('VITE_LIBSQL_DB_URL')
    auth_token = os.getenv('VITE_LIBSQL_DB_AUTH_TOKEN')

    if not db_url or not auth_token:
        raise ValueError("Database URL and auth token must be set in environment variables")

    # Get the directory containing this script
    current_dir = Path(__file__).parent
    migrations_dir = current_dir / 'migrations'

    print('Running migrations...')

    # Connect to Turso using the correct create_client function
    client = create_client(
        url=db_url,
        auth_token=auth_token
    )

    try:
        # Get all .sql files and sort them
        migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

        for file in migration_files:
            print(f'\nRunning migration: {file}')
            try:
                with open(migrations_dir / file, 'r') as f:
                    sql = f.read()
                    await run_migration(client, sql)
                print(f"Migration {file} completed successfully")
            except Exception as e:
                print(f"Error in migration {file}: {e}")
                break

        print('\nMigrations complete!')

    except Exception as e:
        print(f'\nError running migrations: {e}')
        raise
    finally:
        await client.close()

if __name__ == '__main__':
    asyncio.run(migrate())
