import { and, asc, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { drizzleDb } from '../../../db/connection';
import { errorResponse, successResponse } from '../../../helpers/api-response';
import logger from '../../../helpers/logger';
import { systemAuthMiddleware } from '../../../middlewares/system-auth';
import { users } from '../domain/schema';

/**
 * Internal API Routes
 * These endpoints are for service-to-service communication within the infrastructure.
 * Protected by system auth middleware for security.
 *
 * @module internal
 */

const internalRoutes = new Hono();

/**
 * Internal Types
 */
export interface OldestUserQueryParams {
  role?: 'ADMIN' | 'USER';
}

export interface OldestUserResponse {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
}

/**
 * GET /api/internal/users/oldest
 *
 * Returns the oldest active user by role.
 * Used by other services (e.g., product seeder) to get a valid user ID.
 *
 * Query Parameters:
 * - role: Filter by user role ('ADMIN' | 'USER'). Defaults to 'USER'.
 *
 * Response:
 * - 200: Success with user data
 * - 404: No user found matching criteria
 * - 401: Unauthorized (missing/invalid system auth)
 * - 500: Internal server error
 *
 * Example:
 * GET /api/internal/users/oldest?role=USER
 *
 * @security Uses systemAuthMiddleware for service-to-service authentication
 */
internalRoutes.get('/users/oldest', systemAuthMiddleware, async c => {
  try {
    const role = (c.req.query('role') || 'USER').toUpperCase();
    const validRoles = ['ADMIN', 'USER'];

    // Validate role parameter
    if (!validRoles.includes(role)) {
      return errorResponse(
        c,
        `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`,
        'INVALID_ROLE',
        400
      );
    }

    logger.info(`[Internal API] Fetching oldest ${role} user`);

    // Query for oldest active user by role
    const [oldestUser] = await drizzleDb
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, role as 'ADMIN' | 'USER'), isNull(users.deletedAt)))
      .orderBy(asc(users.createdAt))
      .limit(1);

    if (!oldestUser) {
      logger.warn(`[Internal API] No ${role} user found`);
      return errorResponse(c, `No ${role} user found in database`, 'USER_NOT_FOUND', 404);
    }

    logger.info(`[Internal API] Found oldest ${role} user: ${oldestUser.id}`);

    return successResponse(c, oldestUser, `Oldest ${role} user retrieved successfully`);
  } catch (error) {
    logger.error('[Internal API] Failed to fetch oldest user', { error });
    return errorResponse(
      c,
      'Failed to fetch oldest user',
      'FETCH_OLDEST_USER_FAILED',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
});

export default internalRoutes;
