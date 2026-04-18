a# ════════════════════════════════════════
# STAGE 1 – Builder: build Next.js
# ════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ════════════════════════════════════════
# STAGE 2 – Runner: runtime với g++ + ccache + PCH
# ════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

# build-base = g++, ccache = cache compiler output
RUN apk add --no-cache build-base ccache

# ── Precompile Headers (PCH) ──────────────────────────
# Tìm bits/stdc++.h và precompile cho cả 2 chế độ.
# g++ sẽ tự dùng .gch nếu flags khớp → parse headers ~0ms.
RUN set -e; \
    GCC_VER=$(g++ -dumpversion | cut -d. -f1); \
    BITS=$(find /usr/include/c++ -name "stdc++.h" -path "*/bits/*" 2>/dev/null | head -1); \
    if [ -n "$BITS" ]; then \
        echo "Precompiling PCH from: $BITS"; \
        # Fast mode: O0 (default)
        g++ -std=c++20 -O0 -pipe -x c++-header "$BITS" -o "${BITS}.gch_fast"; \
        # Optimize mode: O2
        g++ -std=c++20 -O2 -pipe -x c++-header "$BITS" -o "${BITS}.gch_opt"; \
        # Symlink mặc định → fast (đổi lúc runtime qua env)
        ln -sf "${BITS}.gch_fast" "${BITS}.gch"; \
        echo "PCH ready: $(ls -lh ${BITS}.gch*)"; \
    else \
        echo "WARNING: bits/stdc++.h not found, skipping PCH"; \
    fi

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ccache: lưu cache trong /tmp/ccache (tmpfs → nhanh nhất)
ENV CCACHE_DIR=/tmp/ccache
ENV CCACHE_MAXSIZE=512M
ENV CCACHE_COMPRESS=1
# Wrap g++ bằng ccache qua PATH
ENV PATH=/usr/lib/ccache:$PATH

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public                          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# ccache dir phải writable bởi nextjs user
RUN mkdir -p /tmp/ccache && chown nextjs:nodejs /tmp/ccache

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
