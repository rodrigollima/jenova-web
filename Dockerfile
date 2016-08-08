FROM nginx

RUN mkdir -p /usr/share/nginx/html

COPY ./nginx/htdocs /usr/share/nginx/html/

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443