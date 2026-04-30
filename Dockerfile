# Multi-stage Dockerfile for Mugen Game
# Build stage for frontend and backend

FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend assets only (server runs via tsx at runtime)
RUN pnpm --filter @mugen/client exec vite build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built packages
COPY --from=builder /app/packages ./packages

# Install dependencies for runtime (includes tsx used by server start command)
RUN pnpm install --frozen-lockfile

# Create logs directory
RUN mkdir -p /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5174

# Expose port
EXPOSE 5174

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5174/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["pnpm", "--filter", "@mugen/server", "exec", "tsx", "src/server.ts"]
