#!/bin/bash

# Debug: Print environment variables
echo "DEBUG: PORT environment variable: '$PORT'"
echo "DEBUG: All environment variables containing PORT:"
env | grep -i port || echo "No PORT variables found"

# Use Railway's PORT environment variable, fallback to 8000
if [ -z "$PORT" ]; then
    echo "PORT not set, using default 8000"
    PORT=8000
else
    echo "Using PORT from environment: $PORT"
fi

echo "Starting server on port $PORT"

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT