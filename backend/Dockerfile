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

# Copy startup script
COPY backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Create and set up the non-root user
RUN useradd --system --create-home appuser
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app && chown appuser:appuser /app/start.sh
USER appuser

EXPOSE 8000

# Use the startup script
CMD ["/app/start.sh"]