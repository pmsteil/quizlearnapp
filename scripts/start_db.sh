#!/bin/bash

# Kill any existing turso dev or sqld processes
pkill -f "turso dev" || true
pkill -f "sqld" || true

# Start the local database server in the background
nohup turso dev --db-file "./backend/data/db/quizlearn.db" > ./backend/data/db/turso.log 2>&1 &

# Wait a moment to ensure the server starts
sleep 2

# Check if the server started successfully
if pgrep -f "sqld" > /dev/null; then
    echo "Database server started successfully"
    echo "Logs available at: backend/data/db/turso.log"
else
    echo "Failed to start database server"
    cat ./backend/data/db/turso.log
    exit 1
fi
