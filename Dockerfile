FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci --omit=dev --workspace server --include-workspace-root
COPY server ./server
ENV NODE_ENV=production
USER node
CMD ["node", "server/src/index.js"]
