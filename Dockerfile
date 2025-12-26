# --- Stage 1: Build (Vite/rolldown requires Node >= 20.19) ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time base URL (Nginx sẽ proxy /api sang backend)
ENV VITE_API_BASE_URL=/api
RUN npm run build

# --- Stage 2: Serve bằng Nginx ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]