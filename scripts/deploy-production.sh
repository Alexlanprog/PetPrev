#!/bin/bash

# ==============================================================================
# Script de Deploy de Produção - PetPrev
# Este script deve ser executado na raiz do projeto na VPS Linux (ex: Hostinger).
# Requisitos: Ubuntu 22.04+, Docker, Docker Compose, Git.
# ==============================================================================

set -e

echo "🚀 Iniciando deploy de produção - PetPrev..."

# 1. Validar estrutura e permissões
if [ ! -f "docker-compose.prod.yml" ]; then
  echo "❌ ERRO: docker-compose.prod.yml não encontrado. Execute este script na raiz do projeto."
  exit 1
fi

chmod +x scripts/*.sh

# 2. Verificação de Variáveis de Ambiente
if [ ! -f ".env" ]; then
  echo "⚠️ AVISO: Arquivo .env não encontrado."
  echo "Criando .env a partir de .env.example..."
  cp .env.example .env
  echo "❌ ERRO: Por favor, preencha as variáveis seguras no .env (JWT, senhas) antes de continuar."
  exit 1
fi

# Checagem de segurança (Garante que a senha JWT não é a default)
if grep -q "JWT_ACCESS_SECRET=minha-senha-super-secreta-de-desenvolvimento" ".env"; then
  echo "❌ ERRO DE SEGURANÇA: O arquivo .env ainda contém a JWT_ACCESS_SECRET de desenvolvimento."
  echo "Gere senhas fortes (ex: openssl rand -base64 32) e atualize o arquivo .env."
  exit 1
fi

# 3. Pull das últimas alterações do repositório (Opcional, caso utilize git pull no servidor)
# echo "📦 Atualizando código-fonte via Git..."
# git pull origin main

# 4. Criando diretórios para Nginx / Certbot se não existirem
echo "🔒 Preparando infraestrutura de proxy reverso e SSL..."
mkdir -p docker/nginx/conf.d
mkdir -p /etc/letsencrypt
mkdir -p /var/www/certbot

# 5. Derrubando containers antigos (se existirem) e reconstruindo imagens sem cache
echo "🛑 Parando serviços existentes..."
docker compose -f docker-compose.prod.yml down

echo "🏗️ Construindo containers de produção (Backend e Frontend)..."
docker compose -f docker-compose.prod.yml build --no-cache backend frontend_web

# 6. Subindo infraestrutura e aplicação
echo "🟢 Subindo serviços em background..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deploy de produção iniciado com sucesso!"
echo "--------------------------------------------------------"
echo "🛠️  Ações pós-deploy necessárias:"
echo "1. Se for a primeira vez configurando SSL, execute o Certbot para o seu domínio:"
echo "   docker run --rm -it -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot -p 80:80 certbot/certbot certonly --standalone -d api.petprev.com.br -d app.petprev.com.br"
echo "   Lembre-se de parar o Nginx antes se ele já estiver ocupando a porta 80, e reiniciar depois."
echo "2. Para gerar os logs de acompanhamento, digite: docker compose -f docker-compose.prod.yml logs -f"
echo "--------------------------------------------------------"
