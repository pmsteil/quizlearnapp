import os
from libsql_client import create_client_sync
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database client instance
_db_client = None
_test_db_client = None

def get_db():
    """Get the database client instance."""
    global _db_client
    if _db_client is None:
        _db_client = create_client_sync(
            url=os.getenv("VITE_LIBSQL_DB_URL"),
            auth_token=os.getenv("VITE_LIBSQL_DB_AUTH_TOKEN")
        )
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

        # Enable foreign keys
        _test_db_client.execute("PRAGMA foreign_keys = ON")

        # Create tables if they don't exist
        _test_db_client.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                roles TEXT NOT NULL,
                failed_attempts INTEGER DEFAULT 0,
                last_failed_attempt INTEGER DEFAULT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """)

        _test_db_client.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create indexes
        _test_db_client.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)")
        _test_db_client.execute("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)")

    return _test_db_client

def cleanup_test_db():
    """Clean up test database after tests."""
    if _test_db_client:
        try:
            # Delete in correct order to handle foreign key constraints
            _test_db_client.execute("DELETE FROM sessions")  # Delete child records first
            _test_db_client.execute("DELETE FROM users")     # Then delete parent records
        except Exception as e:
            print(f"Error during cleanup: {str(e)}")

def row_to_dict(row):
    """Convert a database row to a dictionary."""
    if not row:
        return None

    # Get column names from the query result
    # For users table
    if len(row) == 10:  # users table has 10 columns
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "password_hash": row[3],
            "roles": row[4],  # Use the first roles column
            "created_at": row[5],
            "updated_at": row[6],
            # Skip row[7] as it's a duplicate roles column
            "failed_attempts": row[8] if row[8] is not None else 0,
            "last_failed_attempt": row[9] if row[9] is not None else None
        }
    # For sessions table
    elif len(row) == 4:  # sessions table has 4 columns
        return {
            "id": row[0],
            "user_id": row[1],
            "created_at": row[2],
            "expires_at": row[3]
        }
    # For failed_attempts and last_failed_attempt query
    elif len(row) == 2:
        return {
            "failed_attempts": row[0] if row[0] is not None else 0,
            "last_failed_attempt": row[1] if row[1] is not None else None
        }
    # For single column results (e.g., SELECT id FROM users)
    elif len(row) == 1:
        return {"id": row[0]}
    else:
        # For any other queries, use numeric keys
        return {str(i): val for i, val in enumerate(row)}
