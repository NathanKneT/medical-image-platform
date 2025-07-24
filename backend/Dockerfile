# 1. Base stage with Python and system dependencies
FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install only necessary system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Production stage - This will be the final image
FROM base as production

# Copy only the requirements file first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ /app/app/


# Create a non-root user for better security
RUN useradd --system --create-home appuser
# Ensure the new user owns the application files
RUN chown -R appuser:appuser /app
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# The command to run the application in production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]