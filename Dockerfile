# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# Stage 1: Dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Stage 2: Builder (gera dist/)
FROM base AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# build-nolog: evita o log.js/telemetria externa do script "build".
RUN pnpm run build-nolog

# Stage 3: Runner (nginx estático, non-root)
FROM nginxinc/nginx-unprivileged:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
