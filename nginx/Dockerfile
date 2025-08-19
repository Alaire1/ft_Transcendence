# Use an official Nginx base image
FROM nginx:alpine

# Install OpenSSL for Alpine
RUN apk add --no-cache openssl

# Create the SSL directory
ARG HOST_IP
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx.key \
        -out /etc/nginx/ssl/nginx.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=${HOST_IP}"

# Copy the custom Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
