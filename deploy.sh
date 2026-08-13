#!/usr/bin/env bash
# Chạy trên VPS, trong thư mục repo (vd /opt/algominds).
# Gọi thủ công (Bước 7) hoặc tự động qua .github/workflows/deploy.yml.
set -euo pipefail
cd "$(dirname "$0")"

git pull origin main

docker compose -f docker-compose.prod.yml --env-file .env.prod build

# Áp migration đang chờ vào DB thật (migrate deploy, không phải migrate dev)
docker compose -f docker-compose.prod.yml --env-file .env.prod --profile tools run --rm migrate

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

docker image prune -f
