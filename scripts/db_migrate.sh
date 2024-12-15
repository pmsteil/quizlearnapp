#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set up paths
DB_DIR="$SCRIPT_DIR/../backend/data/db"
SCHEMA_FILE="$SCRIPT_DIR/../backend/src/lib/db/schema.sql"
DB_FILE="$DB_DIR/quizlearn.db"

# Create DB directory if it doesn't exist
mkdir -p "$DB_DIR"

# Remove existing database if it exists
rm -f "$DB_FILE"*

# Create new database and apply schema
sqlite3 "$DB_FILE" < "$SCHEMA_FILE"

echo "Database migration completed successfully"
