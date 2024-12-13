import os
from libsql_client import create_client_sync
from dotenv import load_dotenv
import uuid
import time

# Load environment variables
load_dotenv()

# Database client instance
_db_client = None
_test_db_client = None

def initialize_db(db):
    """Initialize database with required tables."""
    # Read schema file
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path, 'r') as f:
        schema = f.read()
    
    # Split schema into individual statements and execute them
    statements = [stmt.strip() for stmt in schema.split(';') if stmt.strip()]
    for stmt in statements:
        if stmt:  # Skip empty statements
            try:
                db.execute(stmt)
            except Exception as e:
                print(f"Error executing statement: {e}")
                print(f"Statement: {stmt}")

    # Create test user if it doesn't exist
    result = db.execute("SELECT COUNT(*) FROM users WHERE email = ?", ["test@example.com"])
    if result.rows[0][0] == 0:
        db.execute("""
            INSERT INTO users (id, email, name, password_hash, roles, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            str(uuid.uuid4()),
            "test@example.com",
            "Test User",
            "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpwBAHHKQS.6YK",  # Password: test123
            "role_user",
            int(time.time()),
            int(time.time())
        ])

def get_db():
    """Get the database client instance."""
    global _db_client
    if _db_client is None:
        _db_client = create_client_sync(
            url=os.getenv("VITE_LIBSQL_DB_URL"),
            auth_token=os.getenv("VITE_LIBSQL_DB_AUTH_TOKEN")
        )
        initialize_db(_db_client)
    return _db_client

def get_test_db():
    """Get the test database client instance."""
    global _test_db_client
    if _test_db_client is None:
        # Load test environment variables
        load_dotenv(".env.test")
        _test_db_client = create_client_sync(
            url=os.getenv("VITE_LIBSQL_DB_URL"),
            auth_token=os.getenv("VITE_LIBSQL_DB_AUTH_TOKEN")
        )
        initialize_db(_test_db_client)
    return _test_db_client

def cleanup_test_db():
    """Clean up test database after tests."""
    global _test_db_client
    if _test_db_client:
        try:
            # Delete in correct order to handle foreign key constraints
            _test_db_client.execute("DELETE FROM sessions")  # Delete child records first
            _test_db_client.execute("DELETE FROM users")     # Then delete parent records
        except Exception as e:
            print(f"Error during cleanup: {str(e)}")
        _test_db_client.close()
        _test_db_client = None

def row_to_dict(row):
    """Convert a database row to a dictionary."""
    if not row:
        return None

    # Get column names from the query result
    if len(row) == 4:  # SELECT id, email, name, roles
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "roles": row[3]
        }
    elif len(row) == 5:  # SELECT id, email, name, password_hash, roles
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "password_hash": row[3],
            "roles": row[4]
        }
    elif len(row) == 7:  # Full user row without failed attempts
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "password_hash": row[3],
            "roles": row[4],
            "created_at": row[5],
            "updated_at": row[6]
        }
    elif len(row) == 9:  # Full user row with failed attempts
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "password_hash": row[3],
            "roles": row[4],
            "failed_attempts": row[5] if row[5] is not None else 0,
            "last_failed_attempt": row[6],
            "created_at": row[7],
            "updated_at": row[8]
        }
    else:
        raise ValueError(f"Unknown row format with {len(row)} columns")
