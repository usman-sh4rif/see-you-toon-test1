# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set environment variables
ENV NODE_ENV=development
ENV npm_config_loglevel=warn

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - use npm install which is more forgiving
# npm ci requires exact lock file match, npm install is more flexible
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Runtime stage
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Setup application directory
RUN chmod 755 /app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
