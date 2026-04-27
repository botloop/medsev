# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy workspace manifests (needed for npm ci to resolve workspaces)
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY client/package.json ./client/

# Install server workspace deps (including devDeps for esbuild)
RUN npm ci --workspace=server

# Copy source files needed for the build
COPY shared/ ./shared/
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/tsconfig.json

# Build: esbuild bundles server + shared into a single dist/server.js
RUN npm run build --workspace=server

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Copy workspace manifests again for production install
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY client/package.json ./client/

# Install only production dependencies
RUN npm ci --workspace=server --omit=dev

# Copy the bundled server output
COPY --from=builder /app/server/dist/server.js ./server/dist/server.js

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server/dist/server.js"]
