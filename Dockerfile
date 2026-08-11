# Latest stable bun (no nightlies — canary broke deploys with a frozen-lockfile
# false positive). Rolls to 1.4-alpine automatically once bun publishes it.
FROM oven/bun:alpine AS base
WORKDIR /app

# Node.js from edge: the Angular builder runs on node, bun drives the scripts.
# (Zig is gone — the font compiler ships as a prebuilt JS fallback now.)
RUN apk add --no-cache nodejs \
    --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

# Install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy node_modules from temp directory and copy source files
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ARG BUILD_ENV=prod
ENV BUILD_ENV=${BUILD_ENV}

# Generate the MCP component metadata asset, then prerender every route (SSG).
RUN bun run build:docs

FROM nginx:alpine

# The fully prerendered site — there is no runtime server, nginx serves files.
COPY --from=prerelease /app/dist/design-system/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
