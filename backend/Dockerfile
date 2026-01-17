# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Install minimal system deps (future-proof for PDF tools)
RUN apk add --no-cache \
  bash \
  curl \
  libc6-compat \
  poppler-utils

# Copy pruned node_modules, compiled code, and package.json from the builder stage
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Create required directories
RUN mkdir -p uploads temp

EXPOSE 3000

CMD ["node", "dist/app.js"]

