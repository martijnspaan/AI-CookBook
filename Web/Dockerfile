# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Accept build time as build argument
ARG BUILD_TIME
ENV BUILD_TIME=${BUILD_TIME}

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code (excluding node_modules)
COPY . .
RUN rm -rf node_modules

# Reinstall dependencies for the correct platform
RUN npm ci

# Replace build time placeholder in environment files
RUN sed -i "s/BUILD_TIME_PLACEHOLDER/$BUILD_TIME/g" src/environments/environment.ts
RUN sed -i "s/BUILD_TIME_PLACEHOLDER/$BUILD_TIME/g" src/environments/environment.prod.ts

# Build the Angular application
RUN npm run build --prod

# Production stage with Nginx
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built Angular application (Angular 17+ outputs to browser subdirectory)
COPY --from=build /app/dist/meal-week-planner-web/browser .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 4200
EXPOSE 4200

# Create shared data directory
RUN mkdir -p /shared-data

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
