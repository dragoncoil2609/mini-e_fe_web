# Stage 1: Build Nodejs
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# 🔥 DÒNG MỚI QUAN TRỌNG: Copy file config vào image
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
