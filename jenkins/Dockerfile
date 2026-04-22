# ═══════════════════════════════════════════════════════
#  ProTask · Backend Dockerfile
#  File: backend/Dockerfile
#
#  Build context must be the backend/ folder.
#  docker-compose.yml uses: build: ../backend
# ═══════════════════════════════════════════════════════

FROM node:20-alpine

WORKDIR /app

# Copy package files first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source — Dockerfile expects backend/src/
COPY src ./src

EXPOSE 5000

CMD ["npm", "start"]