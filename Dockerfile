FROM oven/bun:canary-alpine AS base
WORKDIR /app

# Install latest 0.15.x Zig and Node.js natively overriding older Alpine defaults via edge repository injections
RUN apk add --no-cache zig nodejs --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

# Install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy node_modules from temp directory and copy source files
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Define the build-time variable with a default value
ARG BUILD_ENV=dev
ENV BUILD_ENV=${BUILD_ENV}

# Run the Angular compilation normally (avoiding --bun flag since Angular SSR relies on Node-specific memory streams)
RUN if [ "$BUILD_ENV" = "prod" ]; then \
  bun run build:docs; \
  else \
  bun run build:docs; \
  fi

FROM nginx:alpine

# Copy the built static files from the builder stage
COPY --from=prerelease /app/dist/design-system/browser /usr/share/nginx/html

# Optional: Copy a custom Nginx configuration if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]