# ════════════════════════════════════════════════════════════════
# STAGE 1 – Builder
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN mkdir -p /app/public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ════════════════════════════════════════════════════════════════
# STAGE 2 – Runner: g++ / gcc / python3 + ccache + PCH
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

# Compilers: g++, gcc (build-base), Python 3, ccache
RUN apk add --no-cache build-base ccache python3

# ── Precompile bits/stdc++.h (speeds up first C++ run) ──────────────────────
RUN set -e; \
    BITS=$(find /usr/include/c++ -name "stdc++.h" -path "*/bits/*" 2>/dev/null | head -1); \
    if [ -n "$BITS" ]; then \
        echo "Precompiling PCH: $BITS"; \
        g++ -std=c++20 -O0 -pipe -x c++-header "$BITS" -o "${BITS}.gch_fast"; \
        g++ -std=c++20 -O2 -pipe -x c++-header "$BITS" -o "${BITS}.gch_opt"; \
        ln -sf "${BITS}.gch_fast" "${BITS}.gch"; \
        echo "PCH ready"; \
    else \
        echo "WARNING: bits/stdc++.h not found — skipping PCH"; \
    fi

# ── Verify toolchain ─────────────────────────────────────────────────────────
RUN g++ --version && gcc --version && python3 --version

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

# ── Copy standalone Next.js build ────────────────────────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/public               ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone      ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static          ./.next/static

# ── Socket.IO modules not auto-traced by Next.js standalone ──────────────────
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io          ./node_modules/socket.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io          ./node_modules/engine.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ws                 ./node_modules/ws
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@socket.io         ./node_modules/@socket.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-adapter  ./node_modules/socket.io-adapter
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-parser   ./node_modules/socket.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io-parser   ./node_modules/engine.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/accepts            ./node_modules/accepts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/base64id           ./node_modules/base64id
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/cors               ./node_modules/cors
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/debug              ./node_modules/debug
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ms                 ./node_modules/ms

# ── Override standalone server.js with custom Socket.IO server ───────────────
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

RUN npm install negotiator accepts socket.io

# ccache tmp dir (writable by nextjs user)
RUN mkdir -p /tmp/ccache && chown nextjs:nodejs /tmp/ccache

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
