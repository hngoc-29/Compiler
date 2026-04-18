# ════════════════════════════════════════
# STAGE 1 – Builder: build Next.js
# ════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Thư viện native cho một số npm package
RUN apk add --no-cache libc6-compat

# Copy package files trước → tận dụng Docker layer cache
COPY package.json package-lock.json* ./
RUN npm ci

# Copy toàn bộ source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build production (output: standalone)
RUN npm run build

# ════════════════════════════════════════
# STAGE 2 – Runner: runtime với g++
# ════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

# build-base = gcc + g++ + make + musl-dev
# Cần thiết để compile C++ file tạm trong /tmp
RUN apk add --no-cache build-base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# User không phải root để bảo mật
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy Next.js standalone build
COPY --from=builder /app/public                          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000

# Next.js standalone entrypoint
CMD ["node", "server.js"]
