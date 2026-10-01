FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm ci --prefix backend --omit=dev && npm ci --prefix frontend

COPY shared ./shared
COPY backend ./backend
COPY frontend ./frontend

RUN npm run build --prefix frontend

ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "--use-system-ca", "backend/server.js"]
