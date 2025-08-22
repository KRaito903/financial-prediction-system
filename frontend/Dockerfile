# Build stage
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM node:22-alpine AS dev

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]