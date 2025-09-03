FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY codegen.ts ./

# Install tsx globally for runtime
RUN npm install -g tsx

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
EXPOSE 3000 4002

# Start the service
CMD ["tsx", "watch", "src/index.ts"]