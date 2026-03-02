# Antonio Bellanova Vault – Production Image
# Build frontend and run Node server with SQLite

FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY server.ts ./
COPY tsconfig.json* ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Persist SQLite DB: docker run -v vault_data:/app vault (optional)
CMD ["npx", "tsx", "server.ts"]
