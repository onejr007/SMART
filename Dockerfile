# Optimization #21: Containerization (Docker)
# Use a slim Node.js base image for performance and security
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies including devDependencies for build
RUN npm install

# Copy all source files
COPY . .

# Build the portal and any other build steps
RUN npm run build:portal
RUN npm run build

# --- Production Image ---
FROM node:18-slim AS runner

WORKDIR /app

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/api ./api
COPY --from=builder /app/grpc ./grpc
COPY --from=builder /app/proto ./proto

# Install production dependencies only
RUN npm install --omit=dev

# Expose ports for API and gRPC
EXPOSE 3000
EXPOSE 50051

# Health check to ensure container is running correctly
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the production server
CMD ["node", "server.js"]
