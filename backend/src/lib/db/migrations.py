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

                # Split migration into up and down sections
                sections = {}
                current_section = None
                current_statements = []
                current_statement = []

                for line in migration.split('\n'):
                    line = line.strip()
                    
                    if line.startswith('-- migrate:'):
                        if current_section and current_statements:
                            sections[current_section] = current_statements
                        current_section = line.replace('-- migrate:', '').strip()
                        current_statements = []
                        current_statement = []
                    elif line and not line.startswith('--'):
                        current_statement.append(line)
                        if line.endswith(';'):
                            stmt = ' '.join(current_statement)  # Use space instead of newline
                            logger.info(f"Found statement in {migration_file}:")
                            logger.info(stmt)
                            current_statements.append(stmt)
                            current_statement = []

                if current_section and current_statements:
                    sections[current_section] = current_statements

                try:
                    # Execute up migration
                    if 'up' in sections:
                        logger.info(f"Found {len(sections['up'])} statements in {migration_file}")
                        for i, stmt in enumerate(sections['up']):
                            try:
                                logger.info(f"Executing statement {i + 1} in {migration_file}:")
                                logger.info(stmt)
                                db.execute(stmt)
                                db.commit()  # Commit after each statement
                                
                                # Verify table creation
                                if stmt.strip().upper().startswith('CREATE TABLE'):
                                    table_name = stmt.split('(')[0].split()[-1]
                                    logger.info(f"Verifying table {table_name}")
                                    cursor = db.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
                                    schema = cursor.fetchone()
                                    if schema:
                                        logger.info(f"Table {table_name} schema: {schema[0]}")
                                    else:
                                        logger.error(f"Table {table_name} not found after creation!")
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
