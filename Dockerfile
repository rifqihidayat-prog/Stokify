# Stokify — image produksi (Next.js standalone + SQLite di volume /app/data)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Batasi heap build agar aman di server dengan RAM terbatas
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1280
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/app/data \
    DATABASE_URL=file:/app/data/stokify.db
RUN groupadd --system app && useradd --system --gid app app \
  && mkdir -p /app/data && chown app:app /app/data
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server.js"]
