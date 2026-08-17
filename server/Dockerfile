ARG NODE_IMAGE=node:20-bookworm-slim

# ---------- deps: install all deps once ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build: compile + generate prisma client ----------
# Kept as a build target (not squashed into `runtime`) so it can be reused
# directly by the `migrate` service in docker-compose.prod.yml — it still
# has the full devDependencies (prisma CLI, ts-node, @prisma/config) needed
# to load prisma.config.ts, which the slim runtime image below does not.
FROM ${NODE_IMAGE} AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- runtime: slim, prod deps only, non-root ----------
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
RUN groupadd --system nodeapp && useradd --system --gid nodeapp nodeapp \
    && chown -R nodeapp:nodeapp /app
USER nodeapp
EXPOSE 3001
CMD ["node", "dist/main"]
