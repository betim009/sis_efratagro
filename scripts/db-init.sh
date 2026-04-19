#!/usr/bin/env bash
# ===========================================================================
# scripts/db-init.sh — Executa migrations e seeders no PostgreSQL
# Uso: ./scripts/db-init.sh [--seed]
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Carrega .env da raiz se existir
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sis_efratagro}"
DB_USER="${DB_USER:-postgres}"

PGPASSWORD="${DB_PASSWORD:-postgres}"
export PGPASSWORD

echo "==> Aguardando PostgreSQL em ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q 2>/dev/null; do
  sleep 1
done
echo "==> PostgreSQL disponível."

echo "==> Executando migrations..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f "$ROOT_DIR/backend/src/database/migrations.sql"
echo "==> Migrations aplicadas com sucesso."

if [[ "${1:-}" == "--seed" ]]; then
  echo "==> Executando seeders..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "$ROOT_DIR/backend/src/database/seeders.sql"
  echo "==> Seeders aplicados com sucesso."
fi

echo "==> Banco de dados inicializado."
