#!/bin/bash

# Debug: Print environment variables
echo "DEBUG: PORT environment variable: '$PORT'"
echo "DEBUG: Current working directory: $(pwd)"
echo "DEBUG: Contents of /app:"
ls -la /app/
echo "DEBUG: Python path:"
python -c "import sys; print('\n'.join(sys.path))"

# Use Railway's PORT environment variable, fallback to 8000
if [ -z "$PORT" ]; then
    echo "PORT not set, using default 8000"
    PORT=8000
else
    echo "Using PORT from environment: $PORT"
fi

echo "Starting server on port $PORT"

# Set Python path and start the application
export PYTHONPATH=/app:$PYTHONPATH
cd /app

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT