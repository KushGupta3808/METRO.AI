# --- BUILD STAGE ---
FROM python:3.12-slim AS builder

WORKDIR /app

# Install compilation essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# --- RUNTIME STAGE ---
FROM python:3.12-slim AS runner

WORKDIR /app

# Create the non-root user first so we can chown into their home dir
RUN useradd -m metro-user

# Copy built wheels/binaries into metro-user's home, owned by metro-user
COPY --from=builder --chown=metro-user:metro-user /root/.local /home/metro-user/.local
COPY --chown=metro-user:metro-user . .

ENV PATH=/home/metro-user/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV METRO_AI_ENV=production

# Drop privileges to non-root for security hardening
RUN chown -R metro-user:metro-user /app
USER metro-user

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]