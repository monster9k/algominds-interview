FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Vite bakes VITE_* vars into the static bundle at build time, so they must
# be passed as build ARGs (via docker-compose.prod.yml's `build.args`), not
# runtime env — the container never reads them after this stage.
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_NODE_ENV=production
ARG VITE_SENTRY_DSN=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_NODE_ENV=$VITE_NODE_ENV \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN npm run build

# ---------- runtime: static files only, no proxy/SSL logic (Caddy handles that) ----------
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
