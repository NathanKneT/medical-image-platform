#!/bin/bash

# Use Railway's PORT environment variable, fallback to 8000
PORT=${PORT:-8000}

echo "Starting server on port $PORT"
echo "Working directory: $(pwd)"

# Debug: Check database connection
echo "DEBUG: DATABASE_URL: $DATABASE_URL"
echo "DEBUG: Checking if DATABASE_URL is set..."
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set! Using SQLite fallback."
    export DATABASE_URL="sqlite+aiosqlite:///./medical_platform.db"
else
    echo "DATABASE_URL is set: ${DATABASE_URL:0:50}..." # Show first 50 chars for security
fi

# Start the application with PYTHONPATH set inline
cd /app
exec env PYTHONPATH=/app uvicorn app.main:app --host 0.0.0.0 --port $PORT