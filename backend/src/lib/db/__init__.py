import os
import sqlite3
from dotenv import load_dotenv
import uuid
import time
import logging
from .migrations import run_migrations

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database client instance
_db_client = None
_test_db_client = None

def initialize_db(db):
    """Initialize database with required tables."""
    # Enable WAL mode for better concurrency
    db.execute('PRAGMA journal_mode=WAL')
    # Enable foreign keys
    db.execute('PRAGMA foreign_keys=ON')

def get_db():
    """Get the database client instance."""
    global _db_client
    if _db_client is None:
        try:
            logger.info("Creating new database connection")
            db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'db', 'quizlearn.db'))
            logger.info(f"Using database path: {db_path}")
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            
            _db_client = sqlite3.connect(db_path)
            _db_client.row_factory = sqlite3.Row  # This lets us access columns by name
            
            initialize_db(_db_client)
            logger.info("Database connection created successfully")
        except Exception as e:
            logger.error("Error creating database connection")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            raise e
    return _db_client

def get_test_db():
    """Get the test database client instance."""
    global _test_db_client
    if _test_db_client is None:
        # Load test environment variables
        load_dotenv(".env.test")
        _test_db_client = sqlite3.connect(os.getenv("VITE_LIBSQL_DB_URL"))
        _test_db_client.row_factory = sqlite3.Row  # This lets us access columns by name
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
            _test_db_client.commit()
        except Exception as e:
            print(f"Error during cleanup: {str(e)}")
        _test_db_client.close()
        _test_db_client = None

def row_to_dict(row):
    """Convert a database row to a dictionary."""
    if not row:
        return None

    # Get column names from the query result
    if len(row) == 4:  # SELECT user_id, email, name, roles
        return {
            "user_id": row[0],
            "email": row[1],
            "name": row[2],
            "roles": row[3]
        }
    elif len(row) == 5:  # SELECT user_id, email, name, password_hash, roles
        return {
            "user_id": row[0],
            "email": row[1],
            "name": row[2],
            "password_hash": row[3],
            "roles": row[4]
        }
    elif len(row) == 6:  # SELECT user_id, email, name, password_hash, roles, created_at
        return {
            "user_id": row[0],
            "email": row[1],
            "name": row[2],
            "password_hash": row[3],
            "roles": row[4],
            "created_at": row[5]
        }
    elif len(row) == 7:  # SELECT user_id, email, name, password_hash, roles, created_at, updated_at
        return {
            "user_id": row[0],
            "email": row[1],
            "name": row[2],
            "password_hash": row[3],
            "roles": row[4],
            "created_at": row[5],
            "updated_at": row[6]
        }
    else:
        raise ValueError(f"Unexpected number of columns in row: {len(row)}")
