#!/usr/bin/env bash
# ===========================================================================
# scripts/deploy.sh — Deploy de produção
# Uso: ./scripts/deploy.sh
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${ROOT_DIR}/.env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: Arquivo .env.production não encontrado."
  exit 1
fi

echo "==> [1/5] Fazendo backup do banco de dados..."
bash "${SCRIPT_DIR}/backup-db.sh" || echo "AVISO: Backup falhou, continuando deploy..."

echo "==> [2/5] Atualizando código-fonte..."
cd "$ROOT_DIR"
git pull --ff-only

echo "==> [3/5] Construindo imagens de produção..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "==> [4/5] Subindo serviços..."
docker compose -f docker-compose.prod.yml up -d

echo "==> [5/5] Verificando saúde dos containers..."
sleep 10
docker compose -f docker-compose.prod.yml ps

echo ""
echo "==> Deploy concluído com sucesso!"
echo "==> Verifique os logs: docker compose -f docker-compose.prod.yml logs -f"
