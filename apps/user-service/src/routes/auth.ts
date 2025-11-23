import { auth, generateToken, requireRole } from '@common/auth';
import { JWTPayload } from '@common/types';
import bcrypt from 'bcrypt';
import { Hono } from 'hono';
import { Container } from 'typedi';
import { CreateUserCommand } from '../commands/CreateUserCommand';
import { RestoreUserCommand } from '../commands/RestoreUserCommand';
import { GetUserQuery } from '../queries/GetUserQuery';
import { UserRepository } from '../repositories/UserRepository';
import { CreateUserSchema, LoginSchema } from '../validation/auth';

// Define types for Hono context
type User = {
  sub: string;
  email: string;
  role: string;
};

declare module 'hono' {
  interface ContextVariableMap {
    user: User;
  }
}

const authRoutes = new Hono();

// Login endpoint
authRoutes.post('/login', async c => {
  try {
    const body = await c.req.json();
    const validatedData = LoginSchema.parse(body);

    const getUserQuery = Container.get(GetUserQuery);
    const userRepository = Container.get(UserRepository);
    const user = await userRepository.findByEmailForAuth(validatedData.email);

    if (!user) {
      return c.text('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return c.text('Invalid credentials', 401);
    }

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
    const validatedData = CreateUserSchema.parse(body);

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

// Get users (admin only) - simplified for boilerplate
authRoutes.get('/admin/users', auth, requireRole('ADMIN'), async c => {
  try {
    // This is a simplified version for the boilerplate
    // In a real application, you would implement proper pagination and filtering
    return c.json({
      message: 'User listing endpoint - implement pagination and filtering as needed',
      users: [],
    });
  } catch (error) {
    return c.text('Failed to fetch users', 500);
  }
});

// Get user by ID (admin only)
authRoutes.get('/admin/users/:id', auth, requireRole('ADMIN'), async c => {
  try {
    const userId = c.req.param('id');
    const includeDeleted = c.req.query('includeDeleted') === 'true';

    const getUserQuery = Container.get(GetUserQuery);

    const user = includeDeleted
      ? await getUserQuery.executeWithDeleted(userId)
      : await getUserQuery.execute(userId);

    if (!user) {
      return c.text('User not found', 404);
    }

    return c.json(user);
  } catch (error) {
    return c.text('Failed to fetch user', 500);
  }
});

// Soft delete user (admin only)
authRoutes.delete('/admin/users/:id', auth, requireRole('ADMIN'), async c => {
  try {
    const userId = c.req.param('id');
    const force = c.req.query('force') === 'true';

    const userRepository = Container.get(UserRepository);
    const success = await userRepository.delete(userId, force);

    if (!success) {
      return c.text('User not found', 404);
    }

    return c.json({
      message: force ? 'User permanently deleted' : 'User soft deleted',
      userId,
      force,
    });
  } catch (error) {
    return c.text('Failed to delete user', 500);
  }
});

// Restore soft-deleted user (admin only)
authRoutes.post('/admin/users/:id/restore', auth, requireRole('ADMIN'), async c => {
  try {
    const userId = c.req.param('id');

    const restoreUserCommand = Container.get(RestoreUserCommand);
    const restoredUser = await restoreUserCommand.execute(userId);

    return c.json({
      message: 'User restored successfully',
      user: restoredUser,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return c.text('User not found', 404);
    }
    return c.text('Failed to restore user', 500);
  }
});

// Get current user info
authRoutes.get('/me', auth, async c => {
  const user = c.get('user') as JWTPayload;

  const getUserQuery = Container.get(GetUserQuery);
  const userDetails = await getUserQuery.execute(user.sub);

  if (!userDetails) {
    return c.text('User not found', 404);
  }

  return c.json({
    id: userDetails.id,
    email: userDetails.email,
    role: userDetails.role,
  });
});

export default authRoutes;
