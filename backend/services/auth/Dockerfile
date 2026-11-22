FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=8001

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY services/auth/package*.json ./services/auth/
RUN cd services/auth && npm install --omit=dev --ignore-scripts

COPY services/auth ./services/auth
COPY shared ./shared

RUN chown -R node:node /app

USER node
WORKDIR /app/services/auth

EXPOSE 8001
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8001) + '/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
