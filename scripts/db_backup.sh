#!/bin/bash

# Create backup directory if it doesn't exist
BACKUP_DIR="backend/data/backups"
mkdir -p "$BACKUP_DIR"

# Get current timestamp for backup file name
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/quizlearn_db_$TIMESTAMP.sqlite"

# Get the database path from the environment file
LOCAL_DB_PATH=$(grep LOCAL_DB_PATH .env | cut -d '=' -f2)

# If LOCAL_DB_PATH is not found in .env, error out
if [ -z "$LOCAL_DB_PATH" ]; then
    echo "Error: LOCAL_DB_PATH not found in .env file"
    exit 1
fi

# hardcode the database path
LOCAL_DB_PATH="backend/data/db/quizlearn.db"

# Check if source database exists
if [ ! -f "$LOCAL_DB_PATH" ]; then
    echo "Error: Database file not found at $LOCAL_DB_PATH"
    exit 1
fi

# Create backup using SQLite's .backup command
echo "Creating backup of database..."
sqlite3 "$LOCAL_DB_PATH" ".backup '$BACKUP_FILE'"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created successfully at: $BACKUP_FILE"
else
    echo "Error: Backup failed"
    exit 1
fi
