# Build stage
FROM node:20-alpine AS builder

# Install Rust for wasm-pack
RUN apk add --no-cache curl build-base && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    source $HOME/.cargo/env && \
    cargo install wasm-pack

# Enable corepack for Yarn
RUN corepack enable

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy workspace package files
COPY apps/backend/package.json ./apps/backend/
COPY packages/proto/package.json ./packages/proto/
COPY packages/wasm/package.json ./packages/wasm/

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY packages/proto ./packages/proto
COPY packages/wasm ./packages/wasm
COPY apps/backend ./apps/backend

# Build packages in order, then backend
ENV PATH="/root/.cargo/bin:${PATH}"
RUN yarn workspace @stackly/proto build && \
    yarn workspace @stackly/wasm build && \
    yarn workspace @stackly/backend build

# Production stage
FROM node:20-alpine AS production

# Enable corepack for Yarn
RUN corepack enable

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy workspace package files
COPY apps/backend/package.json ./apps/backend/
COPY packages/proto/package.json ./packages/proto/
COPY packages/wasm/package.json ./packages/wasm/

# Install production dependencies only
ENV NODE_ENV=production
RUN yarn workspaces focus @stackly/backend --production

# Copy built artifacts
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/proto/dist ./packages/proto/dist
COPY --from=builder /app/packages/proto/src/generated ./packages/proto/src/generated
COPY --from=builder /app/packages/wasm/pkg ./packages/wasm/pkg

# Set working directory to backend
WORKDIR /app/apps/backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
