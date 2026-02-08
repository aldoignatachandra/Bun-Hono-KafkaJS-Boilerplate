import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { configLoader } from './config/loader';
import { auth } from './middlewares/auth';
import { basicAuthMiddleware } from './middlewares/basic-auth';
import { loginHandler, logoutHandler } from './modules/auth/handlers/auth';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Health check endpoint
app.get('/health', c => {
  return c.json({
    status: 'ok',
    service: 'auth-service',
    environment: configLoader.getEnvironment(),
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes

// Login: Protected by Basic Auth Middleware (validates credentials)
app.post('/auth/login', basicAuthMiddleware, loginHandler);

// Logout: Protected by JWT Auth Middleware (validates session token)
app.post('/auth/logout', auth, logoutHandler);

// Gateway routes placeholder
app.get('/', c => {
  return c.json({
    message: 'Auth Service Gateway',
    services: {
      user: 'http://localhost:3101',
      product: 'http://localhost:3102',
    },
  });
});

export default app;
