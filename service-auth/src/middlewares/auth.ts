import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';
import { eq, and, gt } from 'drizzle-orm';
import { configLoader } from '../config/loader';
import { JWTPayload } from '../helpers/types';
import { drizzleDb } from '../db/connection';
import { userSessions } from '../db/schema';

// Extended JWTPayload to include jti
interface ExtendedJWTPayload extends JWTPayload {
  jti: string;
}

// Authentication middleware
export const auth = createMiddleware(async (c: Context, next) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader) {
    return c.json({ message: 'Unauthorized: Missing authorization header' }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  try {
    // 1. Stateless Verification (Signature)
    const secret = configLoader.getConfig().auth.jwt.secret;
    const payload = jwt.verify(token, secret) as ExtendedJWTPayload;

    if (!payload.jti) {
      return c.json({ message: 'Unauthorized: Invalid token structure' }, 401);
    }

    // 2. Stateful Verification (Session DB Check)
    // Query DB to ensure session exists and is not expired
    const session = await drizzleDb.query.userSessions.findFirst({
      where: and(
        eq(userSessions.id, payload.jti),
        gt(userSessions.expiresAt, new Date()) // Ensure not expired
      ),
    });

    if (!session) {
      return c.json({ message: 'Unauthorized: Session invalid or expired' }, 401);
    }

    // Optional: Update lastUsedAt asynchronously (fire and forget)
    // drizzleDb.update(userSessions).set({ lastUsedAt: new Date() }).where(eq(userSessions.id, session.id)).execute();

    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ message: 'Unauthorized: Invalid token' }, 401);
  }
});

// Role-based authorization middleware
export const requireRole = (role: 'ADMIN' | 'USER') =>
  createMiddleware(async (c: Context, next) => {
    const user = c.get('user') as JWTPayload;

    if (!user || user.role !== role) {
      return c.json({ message: 'Forbidden: Insufficient permissions' }, 403);
    }

    await next();
  });
