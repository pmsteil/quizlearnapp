#!/bin/bash

# Change to the project root directory relative to the script location
cd "$(dirname "$0")/.." || exit

# Kill any existing processes on ports 5173 and 5174 (Vite default ports)
if command -v lsof >/dev/null 2>&1; then
    echo "Checking for processes on ports 5173 and 5174..."
    PIDS_5173=$(lsof -ti :5173)
    PIDS_5174=$(lsof -ti :5174)
    PIDS="$PIDS_5173 $PIDS_5174"
    if [ ! -z "$PIDS" ]; then
        echo "Killing existing processes on ports 5173/5174..."
        kill -9 $PIDS 2>/dev/null || true
    fi
fi

# Start the frontend development server
echo "Starting frontend development server..."
npm run dev -w frontend
