FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTORCH_ENABLE_MPS_FALLBACK=1
ENV CUDA_VISIBLE_DEVICES=""
ENV DOCKER_ENV=1
ENV PYTORCH_DISABLE_MPS=1

COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code (bao gồm models/, artifacts/)
COPY . .

# Chỉ cần set permissions cho writable directories
RUN chmod -R 755 models artifacts data

EXPOSE 4006

CMD ["strawberry", "server", "--host", "0.0.0.0", "--port", "4006", "graphql_api.schema"]