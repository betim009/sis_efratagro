#!/usr/bin/env bash
# ===========================================================================
# scripts/backup-db.sh — Backup do PostgreSQL
# Uso: ./scripts/backup-db.sh
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"

# Carrega .env de produção se existir
ENV_FILE="${ROOT_DIR}/.env.production"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sis_efratagro}"
DB_USER="${DB_USER:-postgres}"

PGPASSWORD="${DB_PASSWORD:-postgres}"
export PGPASSWORD

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "==> Iniciando backup de ${DB_NAME}..."

docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_FILE"

echo "==> Backup salvo em: ${BACKUP_FILE}"
echo "==> Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"

# Remove backups com mais de 30 dias
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "==> Backups antigos (>30 dias) removidos."
