# Backend Implementation with CQRS Pattern

## Introduction

This section provides comprehensive guidance on implementing backend services using CQRS (Command Query Responsibility Segregation) pattern with Bun, Hono, Drizzle, and PostgreSQL. The implementation follows enterprise-grade practices with proper separation of concerns, dependency injection, and type safety.

## Environment Configuration

### Environment Variables Setup

Create a `.env` file at project root with the following configuration:

```bash
# Database Configuration
DB_URL="postgresql://postgres:postgres@localhost:5432/cqrs_demo?schema=public"
DB_POOL_MIN=1
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=10000

# Authentication Configuration
JWT_SECRET="supersecret-change-me-in-production"
JWT_EXPIRES="1d"

# Service Ports
USER_SERVICE_PORT=3101
PRODUCT_SERVICE_PORT=3102

# Kafka Configuration
KAFKA_BROKERS="localhost:19092,localhost:29092"
KAFKA_CLIENT_ID="cqrs-demo"
KAFKA_SSL="false"
KAFKA_SASL_MECHANISM=""
KAFKA_USERNAME=""
KAFKA_PASSWORD=""
```

### Database Schema Design

The Drizzle schema defines the core data model with proper relationships and constraints:

```typescript
// packages/drizzle/src/schema/entities/users.ts
import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from '../relations';

export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: roleEnum('role').default('USER'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'), // For soft delete
  },
  table => ({
    ...relations.users,
  })
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    price: text('price').notNull().$type<number>(),
    ownerId: uuid('owner_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'), // For soft delete
  },
  table => ({
    ...relations.products,
  })
);

export const eventDedup = pgTable('event_dedup', {
  key: text('key').primaryKey(),
  firstSeenAt: timestamp('first_seen_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // For soft delete
});
```

### Database Initialization

Execute the following commands to set up the database:

```bash
# Generate Drizzle client and run migrations
bun run db:generate
bun run db:migrate

# Seed database with initial data
bun run db:seed
```

### Database Seeding Script

Create a comprehensive seeding script for development and testing:

```typescript
// packages/drizzle/src/seeding/seeds/dev.ts
import { drizzle } from '../db';
import { users } from '../schema/entities/users';
import { bcrypt } from 'bcrypt';

async function main() {
  // Create admin user with hashed password
  const adminPassword = await bcrypt.hash('password', 10);
  const admin = await drizzle
    .insert(users)
    .values({
      email: 'admin@local.test',
      password: adminPassword,
      role: 'ADMIN',
    })
    .returning();

  // Create regular user for testing
  const userPassword = await bcrypt.hash('userpass', 10);
  const testUser = await drizzle
    .insert(users)
    .values({
      email: 'user1@local.test',
      password: userPassword,
      role: 'USER',
    })
    .returning();

  console.log('Database seeded successfully:', { admin, testUser });
}

main()
  .catch(e => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cleanup if needed
  });
```

## Common Package Implementation

### Database Connection Management

Implement a singleton Drizzle client with connection pooling:

```typescript
// packages/common/src/db.ts
import 'reflect-metadata';
import { drizzle } from '@cqrs/drizzle';

const db = drizzle({
  // Connection pool configuration
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '10'),
  connectionTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '10000'),
});

// Graceful shutdown
process.on('beforeExit', async () => {
  // Cleanup connections if needed
});

export default db;
```

### Authentication Middleware

Implement JWT-based authentication with role-based access control:

```typescript
// packages/common/src/auth.ts
import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';
import { Context } from 'hono';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Authentication middleware
export const auth = createMiddleware(async (c: Context, next) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader) {
    return c.text('Unauthorized: Missing authorization header', 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.text('Unauthorized: Invalid token', 401);
  }
});

// Role-based authorization middleware
export const requireRole = (role: 'ADMIN' | 'USER') =>
  createMiddleware(async (c: Context, next) => {
    const user = c.get('user') as JWTPayload;

    if (!user || user.role !== role) {
      return c.text('Forbidden: Insufficient permissions', 403);
    }

    await next();
  });
});

// JWT token generation
export const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES || '1d' }
  );
};
```

### Dependency Injection Setup

Configure TypeDI for dependency injection:

```typescript
// packages/common/src/di.ts
import 'reflect-metadata';
import { Container } from 'typedi';

// Set up dependency injection container
Container.set({
  global: true,
});

export { Container };
```

### Validation Schemas

Implement Zod schemas for request validation:

```typescript
// packages/common/src/validation.ts
import { z } from 'zod';

// User validation schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']).optional().default('USER'),
});

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

// Product validation schemas
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
});

// Type exports
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
```

### Logger Configuration

Set up structured logging with Pino:

```typescript
// packages/common/src/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default logger;
```

## CQRS Implementation Pattern

### Command Handlers

Command handlers are responsible for write operations and business logic:

```typescript
// apps/user-service/src/commands/CreateUserCommand.ts
import { Service } from 'typedi';
import { CreateUserInput } from '@common/validation';
import { UserRepository } from '../repositories/UserRepository';
import { UserEventPublisher } from '../events/UserEventPublisher';
import bcrypt from 'bcrypt';

@Service()
export class CreateUserCommand {
  constructor(
    private userRepository: UserRepository,
    private eventPublisher: UserEventPublisher
  ) {}

  async execute(data: CreateUserInput) {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Publish event
    await this.eventPublisher.publishUserCreated(user);

    return user;
  }
}
```

### Query Handlers

Query handlers are optimized for read operations:

```typescript
// apps/user-service/src/queries/GetUserQuery.ts
import { Service } from 'typedi';
import { UserRepository } from '../repositories/UserRepository';

@Service()
export class GetUserQuery {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string) {
    return this.userRepository.findById(id);
  }

  async executeByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async executeAll() {
    return this.userRepository.findAll();
  }
}
```

### Repository Pattern

Implement repositories for data access abstraction:

```typescript
// apps/user-service/src/repositories/UserRepository.ts
import { Service } from 'typedi';
import db from '@common/db';
import { users, type User } from '@cqrs/drizzle';

@Service()
export class UserRepository {
  async create(data: { email: string; password: string; role?: string }): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1).execute();
    return user[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1).execute();
    return user[0] || null;
  }

  async findAll(): Promise<User[]> {
    return await db.select().from(users).execute();
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning().execute();
    return user[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id)).execute();
    return true;
  }
}
```

## Service Implementation

### User Service Routes

```typescript
// apps/user-service/src/routes/auth.ts
import { Hono } from 'hono';
import { Container } from 'typedi';
import { LoginSchema, CreateUserInput } from '@common/validation';
import { auth, generateToken, requireRole } from '@common/auth';
import { GetUserQuery } from '../queries/GetUserQuery';
import { CreateUserCommand } from '../commands/CreateUserCommand';

const authRoutes = new Hono();

// Login endpoint
authRoutes.post('/login', async c => {
  try {
    const body = await c.req.json();
    const validatedData = LoginSchema.parse(body);

    const getUserQuery = Container.get(GetUserQuery);
    const user = await getUserQuery.executeByEmail(validatedData.email);

    if (!user) {
      return c.text('Invalid credentials', 401);
    }

    // In production, use proper password comparison
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return c.text('Invalid request', 400);
  }
});

// Protected admin routes
authRoutes.use('/admin/*', auth, requireRole('ADMIN'));

// Create user (admin only)
authRoutes.post('/admin/users', async c => {
  try {
    const body = await c.req.json();
    const validatedData = CreateUserInput.parse(body);

    const createUserCommand = Container.get(CreateUserCommand);
    const user = await createUserCommand.execute(validatedData);

    return c.json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return c.text('Failed to create user', 400);
  }
});

export default authRoutes;
```

### Product Service Routes

```typescript
// apps/product-service/src/routes/products.ts
import { Hono } from 'hono';
import { Container } from 'typedi';
import { CreateProductSchema, UpdateProductInput } from '@common/validation';
import { auth } from '@common/auth';
import { CreateProductCommand } from '../commands/CreateProductCommand';
import { GetProductQuery } from '../queries/GetProductQuery';
import { productCreatedProducer } from '../events/product-events';

const productRoutes = new Hono();

// Authentication middleware for all product routes
productRoutes.use('/products/*', auth);

// Create product
productRoutes.post('/products', async c => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validatedData = CreateProductSchema.parse(body);

    const createProductCommand = Container.get(CreateProductCommand);
    const product = await createProductCommand.execute({
      ...validatedData,
      ownerId: user.sub,
    });

    // Emit Kafka event
    await productCreatedProducer(product);

    return c.json(product);
  } catch (error) {
    return c.text('Failed to create product', 400);
  }
});

// Get user's products
productRoutes.get('/products', async c => {
  const user = c.get('user');
  const getProductQuery = Container.get(GetProductQuery);
  const products = await getProductQuery.executeByOwner(user.sub);
  return c.json(products);
});

// Update product (owner only)
productRoutes.patch('/products/:id', async c => {
  try {
    const user = c.get('user');
    const productId = c.req.param('id');
    const body = await c.req.json();
    const validatedData = UpdateProductInput.parse(body);

    const updateProductCommand = Container.get(UpdateProductCommand);
    const product = await updateProductCommand.execute(productId, validatedData, user.sub);

    return c.json(product);
  } catch (error) {
    return c.text('Failed to update product', 400);
  }
});

// Delete product (owner only)
productRoutes.delete('/products/:id', async c => {
  try {
    const user = c.get('user');
    const productId = c.req.param('id');
    const deleteProductCommand = Container.get(DeleteProductCommand);
    await deleteProductCommand.execute(productId, user.sub);

    return c.text('Product deleted successfully');
  } catch (error) {
    return c.text('Failed to delete product', 400);
  }
});

export default productRoutes;
```

## Application Bootstrap

### Hono Application Setup

```typescript
// apps/user-service/src/app.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Routes
app.route('/', authRoutes);
app.route('/', adminRoutes);

// Health check endpoint
app.get('/health', c => {
  return c.json({ status: 'ok', service: 'user-service' });
});

export default app;
```

### Service Entry Point

```typescript
// apps/user-service/index.ts
import app from './src/app';
import logger from '@common/logger';

const port = Number(process.env.USER_SERVICE_PORT || 3101);

Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`User service running on http://localhost:${port}`);
```

## Performance Optimization

### Database Connection Pooling

Configure optimal connection pool settings:

```typescript
// packages/common/src/db.ts
const db = drizzle({
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '10'),
  connectionTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '10000'),
});
```

### Query Optimization

Implement efficient query patterns:

```typescript
// Optimized repository methods
async findUserProductsOptimized(userId: string) {
  return await db.select()
    .from(products)
    .where(eq(products.ownerId, userId))
    .select({
      id: true,
      name: true,
      price: true,
      createdAt: true,
      // Exclude unnecessary fields
    })
    .orderBy(desc(products.createdAt))
    .execute();
}
```

### Caching Strategy

Implement caching for frequently accessed data:

```typescript
// packages/common/src/cache.ts
import { Service } from 'typedi';

@Service()
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttl: number = 300000) {
    // 5 minutes default
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
```

## Testing Strategy

### Unit Testing

Implement comprehensive unit tests for business logic:

```typescript
// tests/unit/CreateUserCommand.test.ts
import { Container } from 'typedi';
import { CreateUserCommand } from '../src/commands/CreateUserCommand';
import { UserRepository } from '../src/repositories/UserRepository';
import { UserEventPublisher } from '../src/events/UserEventPublisher';

describe('CreateUserCommand', () => {
  let createUserCommand: CreateUserCommand;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEventPublisher: jest.Mocked<UserEventPublisher>;

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
    } as any;

    mockEventPublisher = {
      publishUserCreated: jest.fn(),
    } as any;

    Container.set(UserRepository, mockUserRepository);
    Container.set(UserEventPublisher, mockEventPublisher);
  });

  it('should create user and publish event', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      role: 'USER',
    };

    const expectedUser = {
      id: 'user-id',
      email: userData.email,
      role: userData.role,
      createdAt: new Date(),
    };

    mockUserRepository.create.mockResolvedValue(expectedUser as any);

    const result = await createUserCommand.execute(userData);

    expect(mockUserRepository.create).toHaveBeenCalledWith({
      ...userData,
      password: expect.any(String), // Hashed password
    });
    expect(mockEventPublisher.publishUserCreated).toHaveBeenCalledWith(expectedUser);
    expect(result).toEqual(expectedUser);
  });
});
```

### Integration Testing

Test API endpoints with database integration:

```typescript
// tests/integration/auth.test.ts
import { app } from '../src/app';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    // Clean up database before each test
    // Implementation depends on your test setup
  });

  afterAll(async () => {
    // Clean up database after all tests
    // Implementation depends on your test setup
  });

  it('should login with valid credentials', async () => {
    // Create test user
    // Implementation depends on your test setup

    const response = await app.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });
});
```

This comprehensive backend implementation provides a solid foundation for building scalable microservices with proper separation of concerns, type safety, and enterprise-grade patterns.
