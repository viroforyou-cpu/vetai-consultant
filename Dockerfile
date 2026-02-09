# =============================================================================
# VetAI Consultant - Production Dockerfile
# Multi-stage build: Build React app with Vite → Serve with nginx
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# Uses Node.js to build the React application
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# This creates the /app/dist directory with optimized production files
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# Uses nginx to serve the built React application
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create directory for consultation data (if backend writes here)
RUN mkdir -p /usr/share/nginx/html/consultation_data

# Expose port 80 for web traffic
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx (runs in foreground)
CMD ["nginx", "-g", "daemon off;"]
