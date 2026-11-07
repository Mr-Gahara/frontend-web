# syntax=docker/dockerfile:1
# Image frontend web untuk VPS, di belakang Caddy milik stack backend
# (deploy/README.md). Memakai output standalone Next.js (next.config.ts).

# ---------- Tahap 1: dependency (termasuk dev, dibutuhkan saat build) ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# ---------- Tahap 2: build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Tujuan rewrite /api cadangan (next.config.ts), dibaca saat build. Di produksi
# Caddy sudah meneruskan /api/* ke backend sebelum sampai ke Next.js.
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=${BACKEND_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# npm run build juga menyalin public dan .next/static ke .next/standalone.
RUN npm run build

# ---------- Tahap 3: image akhir ----------
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

# Kode dimiliki root (hanya-baca bagi aplikasi); cache Next.js dapat ditulis.
COPY --from=build /app/.next/standalone ./
RUN mkdir -p .next/cache && chown -R node:node .next/cache

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/login').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
