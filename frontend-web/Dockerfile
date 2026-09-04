# ==============================================================================
# PETPREV — DOCKERFILE FRONTEND WEB (ADMIN / RT)
# TanStack Start / Vite / Nitro SSR
# ==============================================================================

# Estágio 1: Dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Estágio 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_BASE_URL=https://api.petprev.com.br/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# Estágio 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 petprev

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

USER petprev

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
