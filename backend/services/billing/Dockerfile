FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=8005

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install --omit=dev --ignore-scripts

COPY services/billing ./services/billing
COPY shared ./shared

RUN chown -R node:node /app

USER node
WORKDIR /app/services/billing

EXPOSE 8005
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8005) + '/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
