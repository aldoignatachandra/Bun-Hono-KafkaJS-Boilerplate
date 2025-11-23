# Bun + Hono + PostgreSQL + Kafka Microservices (CQRS Boilerplate)

## Executive Summary

This production-grade boilerplate demonstrates a modern microservices architecture using cutting-edge technologies optimized for performance, scalability, and maintainability. The implementation showcases CQRS (Command Query Responsibility Segregation) pattern with event-driven communication through Kafka, providing a robust foundation for building distributed systems.

## Technology Stack

### Runtime & Web Framework

- **Bun**: Ultra-fast JavaScript runtime with built-in bundler, test runner, and package manager
- **Hono**: Lightweight, fast web framework with TypeScript-first approach and middleware support

### Architecture Patterns

- **CQRS**: Separation of command (write) and query (read) operations for optimized data handling
- **Event-Driven Architecture**: Asynchronous communication via Kafka events
- **Domain-Driven Design (DDD)**: Clear bounded contexts with user and product services
- **Dependency Injection**: TypeDI with reflect-metadata for clean service composition

### Data Layer

- **PostgreSQL**: Primary data store with ACID compliance and advanced JSON support
- **Drizzle ORM**: Type-safe database access with migrations and query optimization
- **Connection Pooling**: Configurable pool settings for optimal performance

### Messaging Infrastructure

- **Apache Kafka**: Distributed streaming platform with 2-broker cluster (KRaft mode)
- **KafkaJS**: Modern Node.js client with producer/consumer abstractions
- **Reliability Patterns**: Batching, retries with exponential backoff, and Dead Letter Queues (DLQ)

### Security & Authentication

- **JWT (JSON Web Tokens)**: Stateless authentication with configurable expiration
- **RBAC (Role-Based Access Control)**: ADMIN and USER roles with endpoint protection
- **Password Hashing**: bcrypt for secure password storage

### Development Experience

- **TypeScript**: End-to-end type safety with strict configuration
- **Hot Reload**: Instant feedback during development
- **Structured Logging**: Pino logger with JSON output for production monitoring
- **Environment Management**: Comprehensive .env configuration

## System Architecture

### High-Level Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Admin Panel   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
           ┌─────────────────────┐
           │   API Gateway/LB    │
           └─────────┬───────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
   ┌───────▼──────┐ ┌──▼────┐ ┌────▼─────┐
   │ User Service │ │Product│ │Kafka     │
   │ (Port 3101)  │ │Service│ │Cluster   │
   └──────┬───────┘ │(3102) │ └────┬─────┘
        │          └──┬───┘       │
        └─────────────┼───────────┘
                     │
             ┌────────▼────────┐
             │  PostgreSQL     │
             │   Database      │
             └─────────────────┘
```

### Service Boundaries

#### User Service (Port 3101)

- **Responsibility**: User management, authentication, and authorization
- **Access Control**: ADMIN role for user management operations
- **Key Features**:
  - User registration and management
  - JWT token generation and validation
  - Role-based access control
  - User event publishing to Kafka

#### Product Service (Port 3102)

- **Responsibility**: Product catalog management and operations
- **Access Control**: USER role for product CRUD operations
- **Key Features**:
  - Product creation, retrieval, update, and deletion
  - Owner-based access control
  - Product event publishing to Kafka
  - Cross-service communication via events

### Data Flow Patterns

#### Command Flow (Write Operations)

1. HTTP request arrives at service endpoint
2. Authentication and authorization middleware validates request
3. Command handler processes business logic
4. Data persistence via Drizzle ORM
5. Event publication to Kafka topic
6. Response returned to client

#### Query Flow (Read Operations)

1. HTTP request arrives at service endpoint
2. Authentication middleware validates request
3. Query handler retrieves data from optimized views
4. Response returned to client

#### Event Flow (Async Communication)

1. Producer publishes event to Kafka topic with metadata
2. Consumers subscribe to relevant topics
3. Event processing with idempotency checks
4. Retry mechanism for failed processing
5. Dead Letter Queue for unprocessable events

## Project Structure

```
bun-hono-kafka-cqrs/
├── apps/                          # Microservice applications
│   ├── user-service/              # User management service
│   │   ├── src/
│   │   │   ├── app.ts            # Hono application bootstrap
│   │   │   ├── routes/           # HTTP route definitions
│   │   │   │   ├── auth.ts       # Authentication endpoints
│   │   │   │   └── admin.ts      # Admin-only endpoints
│   │   │   ├── commands/         # Command handlers (write operations)
│   │   │   ├── queries/          # Query handlers (read operations)
│   │   │   ├── services/         # Business logic services
│   │   │   ├── repositories/     # Data access layer
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── events/           # Event producers
│   │   │   └── consumers/        # Event consumers
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── bunfig.toml
│   └── product-service/          # Product management service
│       ├── src/
│       │   ├── app.ts
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   └── products.ts
│       │   ├── commands/
│       │   ├── queries/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── dto/
│       │   ├── events/
│       │   └── consumers/
│       ├── package.json
│       ├── tsconfig.json
│       └── bunfig.toml
├── packages/                      # Shared packages
│   ├── common/                    # Common utilities and types
│   │   ├── src/
│   │   │   ├── auth.ts           # JWT middleware and helpers
│   │   │   ├── db.ts             # Database client singleton
│   │   │   ├── kafka.ts          # Kafka client factory
│   │   │   ├── logger.ts         # Pino logger configuration
│   │   │   ├── validation.ts     # Zod schemas
│   │   │   ├── di.ts             # Dependency injection setup
│   │   │   ├── types.ts          # Shared TypeScript types
│   │   │   ├── config/           # Configuration utilities
│   │   │   │   ├── loader.ts
│   │   │   │   ├── validator.ts
│   │   │   │   └── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── drizzle/                    # Database schema and migrations
│       ├── src/
│       │   ├── schema/           # Drizzle schema definitions
│       │   ├── migrations/        # Database migration files
│       │   ├── repositories/      # Base repository classes
│       │   └── db/              # Database connection management
│       ├── drizzle.config.ts       # Drizzle configuration
│       ├── package.json
│       └── tsconfig.json
├── infra/                         # Infrastructure configuration
│   └── kafka/
│       └── docker-compose.yml    # Kafka cluster configuration
├── .env.example                   # Environment variables template
├── bun.lockb                      # Bun lock file
├── package.json                   # Root package configuration
├── tsconfig.json                   # TypeScript configuration
├── 00_README.md                   # This file
├── 01_BACKEND_CQRS.md             # Backend implementation guide
└── 02_KAFKA_SERVICES.md           # Kafka services guide
```

## Key Architectural Decisions

### CQRS Implementation Rationale

The CQRS pattern provides several benefits for this microservices architecture:

1. **Scalability**: Read and write operations can be optimized independently
2. **Performance**: Query models can be denormalized for faster reads
3. **Flexibility**: Different data storage strategies for commands and queries
4. **Separation of Concerns**: Clear distinction between business operations and data retrieval

### Event-Driven Communication Benefits

1. **Decoupling**: Services communicate through events without direct dependencies
2. **Resilience**: Asynchronous processing prevents cascading failures
3. **Scalability**: Event consumers can scale independently
4. **Auditability**: All state changes are recorded as events
5. **Flexibility**: New consumers can be added without modifying producers

### Technology Selection Justification

#### Bun over Node.js

- 3x faster startup time
- 20-30% faster request processing
- Built-in bundler and test runner
- Native TypeScript support
- Reduced dependency footprint

#### Hono over Express

- Better TypeScript integration
- Faster routing and middleware execution
- Modern API design with async/await support
- Smaller bundle size
- Built-in validation capabilities

#### Drizzle over TypeORM

- Type-safe database access
- Better migration management
- Improved query performance
- Excellent developer experience
- Built-in connection pooling

#### Kafka over RabbitMQ

- Higher throughput and scalability
- Better durability guarantees
- Native support for event sourcing
- Superior replay capabilities
- Better ecosystem for microservices

## Performance Considerations

### Database Optimization

- Connection pooling with configurable limits
- Query optimization through Drizzle's query engine
- Proper indexing strategies for frequently accessed data
- Read replica support for query-heavy operations

### Kafka Optimization

- Batch message processing for improved throughput
- Compression for reduced network overhead
- Partitioning strategies for parallel processing
- Consumer group management for load distribution
- Producer idempotency for exactly-once semantics

### Application Performance

- Lazy loading of dependencies
- Efficient middleware ordering
- Response caching where appropriate
- Memory-efficient event processing

## Security Implementation

### Authentication Flow

1. User submits credentials to `/auth/login`
2. Service validates credentials against database
3. JWT token generated with user claims and role
4. Token returned to client for subsequent requests

### Authorization Implementation

- JWT middleware extracts and validates tokens
- Role-based middleware protects sensitive endpoints
- Resource ownership validation for user data
- Principle of least privilege enforced

### Data Protection

- Password hashing with bcrypt
- Environment variable encryption for secrets
- HTTPS enforcement in production
- Input validation and sanitization

## Monitoring and Observability

### Logging Strategy

- Structured JSON logging with Pino
- Correlation IDs for request tracing
- Log levels for different environments
- Centralized log aggregation ready

### Health Checks

- `/health` endpoint for service availability
- Database connectivity verification
- Kafka cluster connectivity status
- Graceful degradation handling

### Metrics Collection

- Request/response timing
- Error rates and types
- Kafka message processing metrics
- Database query performance

## Development Workflow

### Local Development Setup

1. Clone repository and install dependencies
2. Configure environment variables
3. Start Kafka cluster with Docker Compose
4. Initialize database with migrations and seed data
5. Run services in development mode with hot reload

### Testing Strategy

- Unit tests for business logic
- Integration tests for API endpoints
- Contract tests for Kafka events
- End-to-end tests for critical user flows

### Deployment Considerations

- Containerized services with Docker
- Environment-specific configurations
- Database migration automation
- Rolling deployment strategies
- Health check integration

This boilerplate provides a solid foundation for building production-ready microservices with modern JavaScript/TypeScript technologies, emphasizing performance, scalability, and maintainability.
