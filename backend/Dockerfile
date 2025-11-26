# ---------- Builder ----------
  FROM node:18-alpine AS builder
  WORKDIR /app
  
  # Устанавливаем все зависимости (dev тоже нужны для сборки)
  COPY package*.json ./
  RUN npm ci
  
  # Копируем исходники и собираем
  COPY . .
  RUN npm run build
  
  # ---------- Production ----------
  FROM node:18-alpine AS production
  WORKDIR /app
  
  # Создаём пользователя
  RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
  
  # Ставим только prod-зависимости
  COPY package*.json ./
  RUN npm ci --omit=dev && npm cache clean --force
  
  # Копируем билд из builder-стейджа
  COPY --from=builder /app/dist ./dist
  
  # Копируем скрипты и доп. код, если оттуда что-то используется
  COPY database ./database
  
  USER nestjs
  
  # Продовый порт
  EXPOSE 3001
  
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', r=>process.exit(r.statusCode===200?0:1))"
  
  # Запускаем собранный Nest
  CMD ["node", "dist/main.js"]