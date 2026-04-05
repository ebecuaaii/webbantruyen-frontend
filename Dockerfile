# Dùng Nginx để serve static files (HTML/CSS/JS)
FROM nginx:alpine

# Xóa config mặc định của nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy config nginx tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/

# Copy toàn bộ source FE vào thư mục serve của nginx
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Nginx tự chạy khi container start
CMD ["nginx", "-g", "daemon off;"]
