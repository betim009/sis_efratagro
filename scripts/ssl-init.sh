#!/usr/bin/env bash
# ===========================================================================
# scripts/ssl-init.sh — Primeira emissão de certificado Let's Encrypt
# Uso: ./scripts/ssl-init.sh app.seudominio.com api.seudominio.com
# ===========================================================================
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 dominio1 [dominio2 ...]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DOMAINS=("$@")
DOMAIN_ARGS=""
for d in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $d"
done

echo "==> Criando diretórios para Certbot..."
mkdir -p "${ROOT_DIR}/certbot/www" "${ROOT_DIR}/certbot/conf"

echo "==> Subindo Nginx temporário para challenge ACME..."
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" up -d nginx

echo "==> Emitindo certificado para: ${DOMAINS[*]}"
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" run --rm certbot \
  certbot certonly --webroot -w /var/www/certbot \
  $DOMAIN_ARGS \
  --email admin@${DOMAINS[0]} \
  --agree-tos \
  --no-eff-email

echo "==> Reiniciando Nginx com certificado..."
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" restart nginx

echo "==> Certificado emitido com sucesso!"
