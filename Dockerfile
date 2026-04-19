# ════════════════════════════════════════
# STAGE 1 – Builder
# ════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN mkdir -p /app/public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ════════════════════════════════════════
# STAGE 2 – Runner: g++ + ccache + PCH
# ════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache build-base ccache

# ── Precompile Headers (PCH) ──────────────────────────────────────────────────
RUN set -e; \
    BITS=$(find /usr/include/c++ -name "stdc++.h" -path "*/bits/*" 2>/dev/null | head -1); \
    if [ -n "$BITS" ]; then \
        echo "Precompiling PCH from: $BITS"; \
        g++ -std=c++20 -O0 -pipe -x c++-header "$BITS" -o "${BITS}.gch_fast"; \
        g++ -std=c++20 -O2 -pipe -x c++-header "$BITS" -o "${BITS}.gch_opt";  \
        ln -sf "${BITS}.gch_fast" "${BITS}.gch"; \
        echo "PCH ready"; \
    else \
        echo "WARNING: bits/stdc++.h not found"; \
    fi

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV CCACHE_DIR=/tmp/ccache
ENV CCACHE_MAXSIZE=512M
ENV CCACHE_COMPRESS=1
ENV PATH=/usr/lib/ccache:$PATH

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone Next.js build
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static

# Socket.io không được trace tự động → copy thủ công
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io      ./node_modules/socket.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io      ./node_modules/engine.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ws             ./node_modules/ws
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@socket.io     ./node_modules/@socket.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-adapter ./node_modules/socket.io-adapter
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-parser  ./node_modules/socket.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io-parser  ./node_modules/engine.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/accepts        ./node_modules/accepts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/base64id       ./node_modules/base64id
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/cors           ./node_modules/cors
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/debug          ./node_modules/debug
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ms             ./node_modules/ms

# Override standalone server.js với custom server có Socket.IO
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

WORKDIR /app
RUN npm install negotiator accepts socket.io

RUN mkdir -p /tmp/ccache && chown nextjs:nodejs /tmp/ccache

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
