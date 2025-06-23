FROM node:24-bullseye-slim as base

# Create app directory
WORKDIR /app

RUN apt-get update && \
  apt-get install -y curl unzip && \
  rm -rf /var/lib/apt/lists/*

RUN npm install -g @angular/cli@latest
# RUN npm install -g bun@canary
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN bun --version
RUN ng version

# Copy lock files
COPY package.json package-lock.json bun.lock ./

# Define the build-time variable with a default value
ARG BUILD_ENV=dev

# Set the build-time variable as an environment variable
ENV BUILD_ENV=${BUILD_ENV}

# Install app dependencies
RUN bun i

# Bundle app source
COPY . /app

# Use the environment variable to conditionally run the build command
RUN if [ "$BUILD_ENV" = "prod" ]; then \
  bun run build:docs; \
  else \
  bun run build:docs; \
  fi

FROM nginx:alpine

# Copy the built static files from the builder stage
COPY --from=base /app/dist/design-system/browser /usr/share/nginx/html

# Optional: Copy a custom Nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]