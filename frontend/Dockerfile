# Use an official Nginx image to serve static content
FROM nginx:alpine

# Copy static files to Nginx’s html directory
# COPY ./templates /usr/share/nginx/html/templates

# Copying new frontend files - Comment this out for local development!
COPY ./public /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80
