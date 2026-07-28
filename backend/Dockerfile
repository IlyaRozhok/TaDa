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

# Native deps required by sharp
RUN apk add --no-cache vips-dev fftw-dev

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Copy scripts and additional code if used at runtime
COPY database ./database

USER nestjs

# Production port
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r=>process.exit(r.statusCode===200?0:1))"

# Start compiled Nest app
CMD ["node", "dist/main.js"]
