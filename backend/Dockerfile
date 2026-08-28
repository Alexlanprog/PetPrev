# ==============================================================================
# PETPREV — DOCKERFILE MULTI-STAGE NESTJS BACKEND
# Node.js 20 LTS Alpine (Otimizado, Leve e Seguro)
# ==============================================================================

# Estágio 1: Dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Estágio 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Estágio 3: Execução em Produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
