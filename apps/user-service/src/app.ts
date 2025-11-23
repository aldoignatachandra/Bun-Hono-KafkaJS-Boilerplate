import { configLoader } from '@common/config/loader';
import { drizzleDb } from '@cqrs/drizzle';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Container } from 'typedi';
import authRoutes from './routes/auth';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Initialize dependency injection container
Container.set({
  global: true,
});

// Initialize database connection
const db = drizzleDb;
Container.set('db', db);

// Routes
app.route('/', authRoutes);

// Health check endpoint
app.get('/health', c => {
  return c.json({
    status: 'ok',
    service: 'user-service',
    environment: configLoader.getEnvironment(),
    timestamp: new Date().toISOString(),
  });
});

export default app;
