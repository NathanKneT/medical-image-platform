#!/bin/bash

# Debug: Print environment variables
echo "DEBUG: PORT environment variable: '$PORT'"
echo "DEBUG: Current working directory: $(pwd)"
echo "DEBUG: Contents of /app:"
ls -la /app/
echo "DEBUG: Contents of /app/app:"
ls -la /app/app/
echo "DEBUG: Checking if main.py exists:"
ls -la /app/app/main.py

# Set Python path explicitly
export PYTHONPATH="/app:$PYTHONPATH"
echo "DEBUG: Updated Python path:"
python -c "import sys; print('\n'.join(sys.path))"

# Test if we can import the app
echo "DEBUG: Testing import:"
python -c "import app.main; print('Import successful')" || echo "Import failed"

# Use Railway's PORT environment variable, fallback to 8000
if [ -z "$PORT" ]; then
    echo "PORT not set, using default 8000"
    PORT=8000
else
    echo "Using PORT from environment: $PORT"
fi

echo "Starting server on port $PORT"
cd /app

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT