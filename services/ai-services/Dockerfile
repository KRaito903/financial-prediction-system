FROM python:3.12-slim

WORKDIR /app

# Force sử dụng CPU và disable MPS
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTORCH_ENABLE_MPS_FALLBACK=1
ENV CUDA_VISIBLE_DEVICES=""
ENV DOCKER_ENV=1
ENV PYTORCH_DISABLE_MPS=1
ENV MPS_DISABLE=1

# Copy requirements
COPY requirements.txt .

# Install PyTorch CPU-only version
RUN pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu116

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create directories
RUN mkdir -p models artifacts lightning_logs data

EXPOSE 4006

CMD ["strawberry", "server", "--host", "0.0.0.0", "--port", "4006", "graphql_api.schema"]