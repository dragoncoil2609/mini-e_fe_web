# --- Giai đoạn 1: Build React ---
    FROM node:18-alpine AS builder

    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    
    # Quan trọng: Set Base URL cho API là /api (để Nginx proxy)
    ENV VITE_API_BASE_URL=/api
    
    RUN npm run build
    # (Kết quả build sẽ nằm trong folder /app/dist)
    #kêt quả
    # --- Giai đoạn 2: Chạy Nginx ---
    FROM nginx:alpine
    
    # Copy file build React vào thư mục html của Nginx
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # Copy file cấu hình Nginx custom vào server
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]