# ---------- Production ----------
  FROM node:18-alpine AS production
  WORKDIR /app
  
  RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
  
  COPY package*.json ./
  RUN npm ci --omit=dev && npm cache clean --force
  
  # Копируем билд
  COPY --from=builder /app/dist ./dist
  
  # 🔧 ВАЖНО: добавляем скрипты и, при необходимости, папку database
  COPY scripts ./scripts
  COPY database ./database
  
  USER nestjs
  EXPOSE 3001
  
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', r=>process.exit(r.statusCode===200?0:1))"
  
  CMD ["node", "dist/main.js"]