# 517 112 Digital Logic Design — static course site
# Build:  docker build -t dld-web .
# Run:    docker run --rm -p 8080:8080 dld-web   → http://localhost:8080
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/headers.conf /etc/nginx/conf.d/headers.inc
COPY index.html 404.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY chapters /usr/share/nginx/html/chapters
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
