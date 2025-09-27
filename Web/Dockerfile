# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
# This layer will be cached if package files don't change
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build --if-present

# Production stage
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build /app/dist/ai-cookbook-web/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port 4200
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4200/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
