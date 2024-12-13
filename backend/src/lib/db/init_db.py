import os
import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database with the schema."""
    try:
        # Get the directory of this file
        current_dir = Path(__file__).parent
        schema_path = current_dir / "schema.sql"
        db_path = current_dir / "quiz.db"

        # Read schema file
        with open(schema_path, 'r') as f:
            schema = f.read()

        # Connect to database and execute schema
        conn = sqlite3.connect(db_path)
        conn.executescript(schema)
        conn.commit()
        conn.close()

        logger.info("Database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    init_db()
