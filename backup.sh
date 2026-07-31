#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="/tmp/peakflow_backup_${TIMESTAMP}.dump"
RETAIN_COUNT=7

source /home/apps/peakflow/.env.production

echo "[$(date)] Starting backup..."

docker exec infra-postgres-1 \
  pg_dump -U peakflow_user -d peakflow -Fc \
  > "$DUMP_FILE"

echo "[$(date)] Dump complete: $DUMP_FILE ($(du -sh "$DUMP_FILE" | cut -f1))"

AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
aws s3 cp "$DUMP_FILE" \
  "s3://${S3_BUCKET}/backups/postgres/peakflow_backup_${TIMESTAMP}.dump" \
  --endpoint-url "https://${S3_ENDPOINT}"

echo "[$(date)] Uploaded to R2."

rm "$DUMP_FILE"

# Delete dumps older than RETAIN_COUNT most recent
AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
aws s3 ls "s3://${S3_BUCKET}/backups/postgres/" \
  --endpoint-url "https://${S3_ENDPOINT}" \
  | awk '{print $4}' \
  | sort \
  | head -n "-${RETAIN_COUNT}" \
  | while read -r old_key; do
      AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
      AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
      aws s3 rm "s3://${S3_BUCKET}/backups/postgres/${old_key}" \
        --endpoint-url "https://${S3_ENDPOINT}"
      echo "[$(date)] Deleted old backup: $old_key"
    done

echo "[$(date)] Backup done."
