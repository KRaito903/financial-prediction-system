# Multi-stage build for a smaller production image
FROM python:3.10-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set up a virtual environment and install dependencies
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Configure Numba environment variables for build stage
# This ensures consistent behavior during dependency installation
ENV NUMBA_CACHE_DIR=/tmp/numba_cache
ENV NUMBA_DISABLE_JIT=0

# Create Numba cache directory with proper permissions
RUN mkdir -p /tmp/numba_cache && chmod 755 /tmp/numba_cache

# Copy and install requirements using pip
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-compile Numba functions to avoid runtime compilation issues
# This step forces vectorbt to compile its Numba functions during build
RUN python -c "import numba; import vectorbt; print('Forced Numba cache build completed.')"

# Production stage
FROM python:3.10-slim

# Copy the pre-built virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set standard Python environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Configure Numba for production environment
# We create a writable cache directory and set appropriate permissions
ENV NUMBA_CACHE_DIR=/app/numba_cache
ENV NUMBA_DISABLE_JIT=0

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory and copy application code
WORKDIR /app
COPY . .

# Create Numba cache directory in the application directory
# This ensures the non-root user has write access to the cache
RUN mkdir -p /app/numba_cache && \
    chown -R appuser:appuser /app && \
    chmod 755 /app/numba_cache

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 5050

# Health check with better error handling
# Updated to handle potential connection issues more gracefully
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5050/health', timeout=10)" || exit 1

# Default command to run the application
CMD ["python", "run.py", "prod", "--host", "0.0.0.0", "--port", "5050"]