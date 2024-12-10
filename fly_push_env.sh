#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    source .env
fi

# Set the VITE_ prefixed environment variables
fly secrets set \
    VITE_LIBSQL_DB_URL="$VITE_LIBSQL_DB_URL" \
    VITE_LIBSQL_DB_AUTH_TOKEN="$VITE_LIBSQL_DB_AUTH_TOKEN"

# Set any other environment variables your app needs

