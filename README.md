# Financial Prediction System

A modern microservices-based application built with React, TypeScript, and GraphQL Federation, designed for financial data analysis and prediction capabilities.

## 🏗️ Architecture Overview

This project follows a microservices architecture pattern with:

- **Frontend**: React + TypeScript + Vite application
- **Backend**: GraphQL Federation with Apollo Server
- **Services**: Modular microservices architecture
- **Infrastructure**: Docker containerization with development hot-reload

```
├── frontend/                 # React TypeScript application
├── services/
│   └── users-service/       # GraphQL microservice for user management
├── docker-compose.yml       # Development environment setup
└── README.md
```

## 🚀 Features

### Current Features

- **Modern React Frontend**: Built with React 19, TypeScript, and Vite for fast development
- **GraphQL Federation**: Scalable API architecture using Apollo Federation
- **User Management**: Basic user listing and management functionality
- **Microservices Ready**: Extensible architecture for adding new services
- **Development Environment**: Hot-reload enabled Docker setup
- **Type Safety**: Full TypeScript support across frontend and backend

### Planned Features

- Financial data integration
- Prediction algorithms and models
- Real-time data processing
- Advanced analytics dashboard
- User authentication and authorization

## 🛠️ Technology Stack

### Frontend

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting and formatting

### Backend

- **Apollo Server** - GraphQL server implementation
- **Apollo Federation** - Microservices GraphQL architecture
- **TypeScript** - Type-safe backend development
- **GraphQL Code Generator** - Automatic type generation

### Infrastructure

- **Docker** - Containerization
- **Docker Compose** - Multi-container development environment
- **Apollo Router** - GraphQL gateway and routing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/financial-prediction-system.git
cd financial-prediction-system
```

### 2. Environment Setup

Create environment variables for Apollo Router (optional for basic development):

```bash
# .env (optional)
APOLLO_GRAPH_REF=your-graph-ref
APOLLO_KEY=your-apollo-key
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# For development with hot-reload
docker-compose up --build --watch
```

This will start:

- **Users Service**: http://localhost:4001
- **Apollo Router**: http://localhost:4000
- **Router Metrics**: http://localhost:8088

### 4. Start Frontend Development Server

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: http://localhost:5173

## 🔧 Development Setup

### Backend Development

#### Users Service

```bash
cd services/users-service
npm install

# Generate GraphQL types
npm run generate

# Start development server
npm run dev
```

#### Adding New Services

1. Create a new directory in `services/`
2. Follow the same structure as `users-service`
3. Add the service to `docker-compose.yml`
4. Update Apollo Router configuration

### Frontend Development

```bash
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📊 API Documentation

### GraphQL Schema

The application uses GraphQL Federation. The current schema includes:

#### Users Service

```graphql
type User {
  id: ID!
  name: String!
  email: String!
}

type Query {
  listUsers: [User!]!
}
```

#### Example Query

```graphql
query GetUsers {
  listUsers {
    id
    name
    email
  }
}
```

### GraphQL Playground

- **Users Service**: http://localhost:4001/graphql
- **Federated Gateway**: http://localhost:4000/graphql

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild containers
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs users-service
```

## 📁 Project Structure

```
financial-prediction-system/
├── frontend/                     # React application
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── assets/              # Images, icons, etc.
│   │   ├── App.tsx              # Main App component
│   │   ├── main.tsx             # Application entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   ├── vite.config.ts           # Vite configuration
│   └── tsconfig.json            # TypeScript configuration
├── services/
│   └── users-service/           # User management microservice
│       ├── src/
│       │   ├── datasources/     # Data layer
│       │   │   ├── users-api.ts # Users API implementation
│       │   │   └── users_data.json # Mock data
│       │   ├── context.ts       # GraphQL context
│       │   ├── resolvers.ts     # GraphQL resolvers
│       │   ├── types.ts         # Generated TypeScript types
│       │   ├── users-schema.graphql # GraphQL schema
│       │   └── index.ts         # Service entry point
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml           # Development environment
├── .dockerignore
├── .gitignore
└── README.md
```

## 🔄 Available Scripts

### Frontend Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend Scripts (Users Service)

```bash
npm run dev        # Start development server with hot-reload
npm run start      # Start production server
npm run compile    # Compile TypeScript to JavaScript
npm run generate   # Generate GraphQL types from schema
```

## 🧪 Testing

Currently, the project is set up for testing but doesn't include test implementations yet. To add tests:

### Frontend Testing

```bash
cd frontend
# Add testing dependencies (Jest, React Testing Library, etc.)
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Backend Testing

```bash
cd services/users-service
# Add testing dependencies
npm install --save-dev jest @types/jest ts-jest
```

## 🚀 Deployment

### Production Build

#### Frontend

```bash
cd frontend
npm run build
# Output will be in the 'dist' directory
```

#### Backend Services

```bash
cd services/users-service
npm run compile
npm start
```

### Docker Production

Create a production `docker-compose.prod.yml`:

```yaml
version: "3.8"
services:
  users-service:
    build:
      context: ./services/users-service
      dockerfile: Dockerfile
      target: production
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed
- Ensure Docker builds pass

## 📝 License

This project is licensed under the ISC License.

## 🔗 Useful Links

- [React Documentation](https://react.dev/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Federation](https://www.apollographql.com/docs/federation/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 📞 Support

If you have any questions or run into issues, please:

1. Check the existing [Issues](https://github.com/your-username/financial-prediction-system/issues)
2. Create a new issue with detailed information
3. Reach out to the development team

---

**Happy Coding! 🚀**
