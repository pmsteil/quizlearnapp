import os
import sqlite3
from dotenv import load_dotenv
import uuid
import time
import logging
from pathlib import Path
from typing import Optional
import traceback
from .migrations import run_migrations as _run_migrations

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.debug("Environment variables loaded")

# Database client instance
_test_db_client = None

class DatabaseError(Exception):
    """Custom exception for database errors"""
    pass

def get_db_path():
    """Get database path from environment variables"""
    try:
        db_path = os.environ['LOCAL_DB_PATH']
        logger.debug(f"Retrieved database path from LOCAL_DB_PATH: {db_path}")
        return db_path
    except KeyError:
        logger.error("LOCAL_DB_PATH environment variable not set")
        logger.debug(f"Available environment variables: {list(os.environ.keys())}")
        raise DatabaseError("Database configuration error: LOCAL_DB_PATH environment variable not set")

def initialize_db(db_path: str) -> sqlite3.Connection:
    """Initialize the database connection."""
    try:
        logger.debug(f"Initializing database connection to {db_path}")
        db = sqlite3.connect(db_path)
        db.row_factory = sqlite3.Row

        # Enable WAL mode for better concurrency
        db.execute('PRAGMA journal_mode=WAL')
        logger.debug("WAL mode enabled")

        # Enable foreign keys
        db.execute('PRAGMA foreign_keys=ON')
        logger.debug("Foreign keys enabled")

        # Count number of users for verification
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) as user_count FROM users")
        user_count = cursor.fetchone()['user_count']
        logger.info(f"Current number of users in database: {user_count}")

        return db
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise DatabaseError(f"Failed to initialize database: {str(e)}")

def get_db():
    """Get a new database connection."""
    try:
        logger.info("Creating new database connection")

        # Get database path
        db_path = get_db_path()
        logger.debug(f"Using absolute database path: {os.path.abspath(db_path)}")

        # Create the database directory if it doesn't exist
        db_dir = os.path.dirname(db_path)
        logger.debug(f"Ensuring database directory exists: {db_dir}")
        os.makedirs(db_dir, exist_ok=True)

        logger.info(f"Using database path: {db_path}")

        # Initialize database
        db = initialize_db(db_path)
        logger.info("Database connection created successfully")

        return db

    except (sqlite3.Error, OSError) as e:
        logger.error("Error creating database connection")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.debug(f"Full traceback:\n{traceback.format_exc()}")
        raise DatabaseError("Unable to connect to database")

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

def run_migrations():
    """Run database migrations."""
    try:
        # Create a new connection just for migrations
        db = get_db()
        try:
            _run_migrations(db)
        finally:
            db.close()
    except Exception as e:
        logger.error("Error running migrations")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        raise
