FROM oven/bun:canary-alpine AS base
WORKDIR /app

# 1. Install Node.js from edge, plus dependencies needed to fetch/unpack Zig
RUN apk add --no-cache nodejs wget tar xz \
    --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

# 2. Download and install the exact Zig 0.15.0 binary for Alpine (musl)
# Note: Based on your previous logs, your build architecture is aarch64 (ARM64).
RUN wget https://ziglang.org/download/0.15.2/zig-aarch64-linux-0.15.2.tar.xz \
    && tar -xf zig-linux-aarch64-0.15.2.tar.xz \
    && mv zig-linux-aarch64-0.15.2/zig /usr/local/bin/zig \
    && mv zig-linux-aarch64-0.15.2/lib /usr/local/lib/zig \
    && rm -rf zig-linux-aarch64-0.15.2*

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

# Run the Angular compilation normally
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