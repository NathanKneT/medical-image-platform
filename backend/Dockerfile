# 1. Base stage
FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Production stage
FROM base as production

# Copy requirements from backend directory
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code from backend directory
COPY backend/app/ /app/app/

# Create and set up the non-root user
RUN useradd --system --create-home appuser
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# The command needs to reference the app module correctly
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]