FROM node:20 as build
WORKDIR /app
COPY package.json ./
# Xóa lock file cũ để cài mới từ đầu theo package.json chuẩn vừa sửa
RUN rm -rf package-lock.json node_modules
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
