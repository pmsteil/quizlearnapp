#!/bin/bash

# Exit on any error
set -e

# Source environment variables
# source "$(dirname "$0")/setenv.sh"

# hardcode the database path
LOCAL_DB_PATH="backend/data/db/quizlearn.db"
BACKUP_DIR="backend/data/backups"

# Find the most recent backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/* | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "Error: No backup files found in $BACKUP_DIR"
    exit 1
fi

echo "Found latest backup: $LATEST_BACKUP"
echo "Will restore to: $LOCAL_DB_PATH"
echo "Backup timestamp: $(stat -f "%Sm" "$LATEST_BACKUP")"

# Ask for confirmation
read -p "Are you sure you want to restore this backup? This will overwrite the current database. [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restore cancelled"
    exit 1
fi

# Stop any running server that might be using the database
# echo "Stopping any running servers..."
# pkill -f "sqld" || true
# sleep 2

# Ensure the target directory exists
mkdir -p "$(dirname "$LOCAL_DB_PATH")"

# Restore the backup
cp "$LATEST_BACKUP" "$LOCAL_DB_PATH"

echo "Database restored successfully from backup"
