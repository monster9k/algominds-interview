#!/usr/bin/env bash
# Chạy trên VPS qua cron (Bước 9). Backup pg_dump hằng ngày, giữ 14 ngày local.
# Off-site (khuyến nghị, free): cấu hình `rclone` với 1 remote (vd Backblaze
# B2 free tier) rồi bỏ comment dòng rclone bên dưới.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.prod; set +a

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$(pwd)/backups"
FILE="$BACKUP_DIR/algominds_${TIMESTAMP}.sql.gz"
mkdir -p "$BACKUP_DIR"

docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"

# Giữ 14 ngày backup local
find "$BACKUP_DIR" -name "algominds_*.sql.gz" -mtime +14 -delete

# Đẩy off-VPS — bỏ comment dòng dưới sau khi đã `rclone config` xong remote "b2":
# rclone copy "$FILE" b2:algominds-backups/db/
