FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production
ENV PORT=8000

WORKDIR /app

# Copy root and service manifests for caching
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY gateway/package*.json ./gateway/
RUN cd gateway && npm install --omit=dev --ignore-scripts

# Copy application source
COPY gateway ./gateway
COPY shared ./shared

# Ensure appropriate ownership for the non-root user
RUN chown -R node:node /app

USER node
WORKDIR /app/gateway

EXPOSE 8000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8000) + '/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
