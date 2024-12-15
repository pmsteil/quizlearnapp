import os
import time
import logging
import sqlite3
from typing import List

logger = logging.getLogger(__name__)

def get_migration_files() -> List[str]:
    """Get all migration files sorted by name."""
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    migration_files = []
    for file in os.listdir(migrations_dir):
        if file.endswith('.sql'):
            migration_files.append(file)
    return sorted(migration_files)

def run_migrations(db):
    """Run all migrations in order."""
    try:
        # Drop existing migrations table if it exists with old schema
        db.execute("DROP TABLE IF EXISTS migrations")
        db.commit()

        # Create migrations table
        db.execute("""
            CREATE TABLE migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                applied_at INTEGER NOT NULL
            )
        """)
        db.commit()

        # Get list of applied migrations
        applied = set()
        for row in db.execute("SELECT name FROM migrations"):
            applied.add(row[0])

        # Get list of migration files
        migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
        migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

        # Apply each migration if not already applied
        for migration_file in migration_files:
            if migration_file not in applied:
                logger.info(f"Applying migration: {migration_file}")
                migration_path = os.path.join(migrations_dir, migration_file)
                
                with open(migration_path, 'r') as f:
                    migration = f.read()

                # Split migration into individual statements
                statements = [stmt.strip() for stmt in migration.split(';') if stmt.strip()]
                
                try:
                    # Execute each statement
                    for stmt in statements:
                        try:
                            db.execute(stmt)
                        except sqlite3.OperationalError as e:
                            # Skip errors about existing objects
                            if "already exists" not in str(e):
                                raise
                            logger.warning(f"Skipping existing object in {migration_file}: {str(e)}")
                    
                    # Record migration as applied
                    db.execute(
                        "INSERT INTO migrations (name, applied_at) VALUES (?, ?)",
                        [migration_file, int(time.time())]
                    )
                    db.commit()
                    logger.info(f"Successfully applied migration: {migration_file}")
                except Exception as e:
                    db.rollback()
                    logger.error(f"Error executing migration {migration_file}: {str(e)}")
                    logger.error(f"Statement: {stmt}")
                    raise

    except Exception as e:
        logger.error("Error running migrations")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        raise
