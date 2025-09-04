# Stage 1: Build the application
FROM python:3.13.5-slim

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .

# RUN python -m venv /opt/.venv

RUN  pip install -q --no-cache-dir -r requirements.txt

# Copy the application code
COPY ./src ./src
COPY ./model-finbert-sentiment ./model-finbert-sentiment 

# Copy the entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["./entrypoint.sh"]