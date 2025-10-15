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

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy built application from build stage
COPY --from=build /app/dist/ai-cookbook-web/ /usr/share/nginx/html/

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create nginx temp directories in /tmp and set permissions
RUN mkdir -p /tmp/nginx_client_temp /tmp/nginx_proxy_temp /tmp/nginx_fastcgi_temp /tmp/nginx_uwsgi_temp /tmp/nginx_scgi_temp && \
    chown -R root:root /usr/share/nginx/html /tmp/nginx_*

# Expose port 4200
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4200/ || exit 1

# Start script that substitutes environment variables and starts nginx
CMD ["sh", "-c", "envsubst '${API_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
