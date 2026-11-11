FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY server ./server
COPY migrations ./migrations
RUN pnpm exec esbuild server/index.ts server/migrate.ts \
    --bundle --platform=node --target=node22 --format=esm --packages=external \
    --outdir=dist/server

FROM node:22.23.4-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist/server ./dist/server
COPY --from=build /app/migrations ./migrations
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
