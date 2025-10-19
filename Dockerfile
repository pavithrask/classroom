# syntax=docker/dockerfile:1

########################################
# Front-end build stage
########################################
FROM node:18-bullseye AS frontend-builder
WORKDIR /workspace/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
ARG VITE_API_BASE_URL="https://primary-classes-manager.fly.dev/api/v1"
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

########################################
# Backend runtime stage
########################################
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY --from=frontend-builder /workspace/frontend/dist ./app/static

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
