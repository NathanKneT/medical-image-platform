#!/bin/bash

# Use Railway's PORT environment variable, fallback to 8000
PORT=${PORT:-8000}

echo "Starting server on port $PORT"
echo "Working directory: $(pwd)"

# Quick fix: Force SQLite usage for immediate deployment
echo "DEBUG: Using SQLite database for quick deployment"
export DATABASE_URL="sqlite+aiosqlite:///./medical_platform.db"
echo "DEBUG: DATABASE_URL set to: $DATABASE_URL"

# Start the application with PYTHONPATH set inline
cd /app
exec env PYTHONPATH=/app uvicorn app.main:app --host 0.0.0.0 --port $PORT