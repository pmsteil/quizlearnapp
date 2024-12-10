#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    source .env
fi

APP_NAME="quizlearnapp"  # or whatever your app name is

# Set the VITE_ prefixed environment variables
fly secrets set \
    VITE_LIBSQL_DB_URL="$VITE_LIBSQL_DB_URL" \
    VITE_LIBSQL_DB_AUTH_TOKEN="$VITE_LIBSQL_DB_AUTH_TOKEN" \
    --app $APP_NAME

# Set any other environment variables your app needs

