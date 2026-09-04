#!/bin/bash

# ==============================================================================
# Geração de Certificados SSL Autoassinados para Desenvolvimento Local (Nginx)
# ==============================================================================

CERTS_DIR="./docker/certs/letsencrypt/live"
API_DIR="$CERTS_DIR/api.petprev.com.br"
APP_DIR="$CERTS_DIR/app.petprev.com.br"

mkdir -p "$API_DIR"
mkdir -p "$APP_DIR"

echo "🔐 Gerando certificados SSL autoassinados para desenvolvimento local..."

# Certificado para api.petprev.com.br
if [ ! -f "$API_DIR/fullchain.pem" ]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$API_DIR/privkey.pem" \
    -out "$API_DIR/fullchain.pem" \
    -subj "/C=BR/ST=BA/L=Salvador/O=PetPrev Dev/CN=api.petprev.com.br" \
    2>/dev/null || echo "Aviso: openssl não encontrado. Crie os arquivos manualmente se necessário."
  echo "✅ Certificado para api.petprev.com.br criado."
fi

# Certificado para app.petprev.com.br
if [ ! -f "$APP_DIR/fullchain.pem" ]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$APP_DIR/privkey.pem" \
    -out "$APP_DIR/fullchain.pem" \
    -subj "/C=BR/ST=BA/L=Salvador/O=PetPrev Dev/CN=app.petprev.com.br" \
    2>/dev/null || echo "Aviso: openssl não encontrado. Crie os arquivos manualmente se necessário."
  echo "✅ Certificado para app.petprev.com.br criado."
fi

echo "Pronto! Para montar em desenvolvimento, aponte o volume do docker para $CERTS_DIR"
