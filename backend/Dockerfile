STREAMING_CHUNK: Initializing production build environment

FROM python:3.13-slim AS builder

WORKDIR /app

STREAMING_CHUNK: Configuring system dependencies for wheel building

RUN apt-get update && apt-get install -y --no-install-recommends 

build-essential 

libpq-dev 

gcc 

&& rm -rf /var/lib/apt/lists/*

STREAMING_CHUNK: Restoring pip cache structures and installing packages

COPY requirements_docker.txt .
RUN pip install --no-cache-dir --user -r requirements_docker.txt

STREAMING_CHUNK: Initializing lean runtime execution container

FROM python:3.13-slim AS runner

WORKDIR /app

STREAMING_CHUNK: Copying compiled dependencies from builder stage

COPY --from=builder /root/.local /root/.local
COPY . .

STREAMING_CHUNK: Adjusting environment paths and runtime secrets

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV METRO_AI_ENV=production

STREAMING_CHUNK: Hardening runtime security by dropping privileges to non-root

RUN useradd -m metro-user && chown -R metro-user:metro-user /app
USER metro-user

EXPOSE 8000

STREAMING_CHUNK: Defining uvicorn container entrypoints

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]