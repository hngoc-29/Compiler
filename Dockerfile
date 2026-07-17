# ════════════════════════════════════════════════════════════════
# STAGE 1 – Builder
# ════════════════════════════════════════════════════════════════
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN mkdir -p /app/public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ════════════════════════════════════════════════════════════════
# STAGE 2 – Runner: g++ / gcc / python3 + ccache + PCH + Emscripten
# ════════════════════════════════════════════════════════════════
# BUG FIX: this used to be `node:20-alpine`. Alpine uses musl libc, but the
# Emscripten SDK (installed below, for the "run with client/browser resources"
# WASM feature) ships prebuilt LLVM/clang/Node binaries linked against glibc.
# Those binaries fail to run at all on musl (no matching dynamic linker /
# missing GLIBC symbol versions) — this was silently breaking every WASM
# compile in production. A glibc-based Debian image is the standard,
# reliably-supported target for emsdk's prebuilt toolchain, so both stages
# now use the same Debian base (also avoids any musl/glibc mismatch for
# native node_modules copied between the builder and runner stages).
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Compilers: g++, gcc (build-essential), Python 3, ccache, git (for emsdk),
# ca-certificates (emsdk clones/downloads over https), wget (HEALTHCHECK).
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential ccache python3 git ca-certificates wget xz-utils \
    && rm -rf /var/lib/apt/lists/*

# ── Install Emscripten (for WASM compilation) ────────────────────────────────
RUN git clone https://github.com/emscripten-core/emsdk.git /opt/emsdk && \
    cd /opt/emsdk && \
    ./emsdk install latest && \
    ./emsdk activate latest && \
    chmod -R 777 /opt/emsdk
ENV PATH="/opt/emsdk:/opt/emsdk/upstream/emscripten:${PATH}"

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
RUN g++ --version && gcc --version && python3 --version && emcc --version

# ── Hugging Face Toàn Cầu Biến Môi Trường (Ép chạy cổng 7860) ──────────────────
# ... (Giữ nguyên toàn bộ phần toolchain g++ và env phía trên)

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7860
ENV HOSTNAME="0.0.0.0"
ENV CCACHE_DIR=/tmp/ccache
ENV CCACHE_MAXSIZE=512M
ENV CCACHE_COMPRESS=1
ENV PATH=/usr/lib/ccache:$PATH
ENV HOME=/home/node

# Debian's official node image also ships a 'node' user (UID/GID 1000).
RUN mkdir -p /home/node /tmp/ccache && chown -R node:node /home/node /tmp/ccache

# ── Copy bản build Next.js Standalone (Sửa chown thành node:node) ──────────────
COPY --from=builder --chown=node:node /app/public               ./public
COPY --from=builder --chown=node:node /app/.next/standalone      ./
COPY --from=builder --chown=node:node /app/.next/static          ./.next/static

# ── Thêm các module Socket.IO (Sửa chown thành node:node) ──────────────────────
COPY --from=builder --chown=node:node /app/node_modules/socket.io          ./node_modules/socket.io
COPY --from=builder --chown=node:node /app/node_modules/engine.io          ./node_modules/engine.io
COPY --from=builder --chown=node:node /app/node_modules/ws                 ./node_modules/ws
COPY --from=builder --chown=node:node /app/node_modules/@socket.io         ./node_modules/@socket.io
COPY --from=builder --chown=node:node /app/node_modules/socket.io-adapter  ./node_modules/socket.io-adapter
COPY --from=builder --chown=node:node /app/node_modules/socket.io-parser   ./node_modules/socket.io-parser
COPY --from=builder --chown=node:node /app/node_modules/engine.io-parser   ./node_modules/engine.io-parser
COPY --from=builder --chown=node:node /app/node_modules/accepts            ./node_modules/accepts
COPY --from=builder --chown=node:node /app/node_modules/base64id           ./node_modules/base64id
COPY --from=builder --chown=node:node /app/node_modules/cors               ./node_modules/cors
COPY --from=builder --chown=node:node /app/node_modules/debug              ./node_modules/debug
COPY --from=builder --chown=node:node /app/node_modules/ms                 ./node_modules/ms

# ── Override server.js (Sửa chown thành node:node) ─────────────────────────────
COPY --from=builder --chown=node:node /app/server.js ./server.js

# Cài đặt thêm thư viện và phân phối lại quyền sở hữu cho user node
RUN npm install negotiator accepts socket.io && chown -R node:node /app

USER node
EXPOSE 7860

# Cập nhật cổng kiểm tra sức khỏe hệ thống
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:7860/ || exit 1

CMD ["node", "server.js"]
