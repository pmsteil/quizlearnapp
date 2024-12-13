#!/bin/bash

# Change to the backend directory relative to the script location
cd "$(dirname "$0")/../backend" || exit

# Kill any existing processes on port 3000
if command -v lsof >/dev/null 2>&1; then
    echo "Checking for processes on port 3000..."
    PIDS=$(lsof -ti :3000)
    if [ ! -z "$PIDS" ]; then
        echo "Killing existing processes on port 3000..."
        kill -9 $PIDS
    fi
fi

# Start the backend server
echo "Starting backend server..."
pipenv run uvicorn src.lib.app:app --reload --port 3000
