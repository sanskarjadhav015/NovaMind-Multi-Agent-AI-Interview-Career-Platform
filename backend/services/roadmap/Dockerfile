FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=8004

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY services/roadmap/package*.json ./services/roadmap/
RUN cd services/roadmap && npm install --omit=dev --ignore-scripts

COPY services/roadmap ./services/roadmap
COPY shared ./shared

RUN chown -R node:node /app

USER node
WORKDIR /app/services/roadmap

EXPOSE 8004
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8004) + '/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
