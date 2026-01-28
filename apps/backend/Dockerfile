# Build stage
FROM node:20-alpine AS builder

# Enable corepack for Yarn
RUN corepack enable

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy workspace package files
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY apps/backend ./apps/backend

# Build the application
RUN yarn workspace @stackly/backend build

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

# Install production dependencies only
ENV NODE_ENV=production
RUN yarn workspaces focus @stackly/backend --production

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Set working directory to backend
WORKDIR /app/apps/backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
