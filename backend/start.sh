#!/bin/bash

# Use Railway's PORT environment variable, fallback to 8000
PORT=${PORT:-8000}

echo "Starting server on port $PORT"

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT