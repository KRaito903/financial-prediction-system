# Stage 1: build
FROM python:3.13.5 as builder 

# Set the working directory inside the container.
# This is where your application code will live.
WORKDIR /usr/src/app

# Copy the requirements file into the container first.
# This step is separated to take advantage of Docker's layer caching.
# If requirements.txt doesn't change, Docker won't reinstall the packages on subsequent builds.
COPY requirements.txt .

# init
RUN python -m venv /opt/.venv

# Install the Python dependencies.
# The --no-cache-dir option is used to reduce the image size.
RUN /opt/.venv/bin/pip install --no-cache-dir -q -r requirements.txt

################################################
# Stage 2: Deploy as dev
FROM python:3.13.5-slim as dev

COPY --from=builder /opt/.venv /opt/.venv
WORKDIR /usr/src/app
ENV PATH="/opt/.venv/bin:$PATH"

# Copy the rest of your application's code into the container.
COPY src/ ./src

COPY model-finbert-sentiment/ ./model-finbert-sentiment

# Specify the command to run when the container starts.
CMD ["python", "src/main.py"]
