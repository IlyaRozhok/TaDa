# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (dev deps also needed for build)
COPY package*.json ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

# ---------- Production ----------
FROM node:20-alpine AS production
WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist

USER nestjs

# Production port
EXPOSE 3001

# The route is /api/health: `api` is a global prefix set in main.ts, so the
# bare /health this used to probe answered 404 and the image was permanently
# unhealthy. Only ever masked by docker-compose.yml, which overrides the
# healthcheck with the correct path.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r=>process.exit(r.statusCode===200?0:1))"

# Start compiled Nest app
CMD ["node", "dist/main.js"]
