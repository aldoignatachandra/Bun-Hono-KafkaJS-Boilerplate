import { describe, expect, it, mock } from 'bun:test';
import jwt from 'jsonwebtoken';
import { Container } from 'typedi';
import { configLoader } from '../../../../src/config/loader';
import { CreateUserCommand } from '../../../../src/modules/user/repositories/commands/CreateUserCommand';
import { GetUserQuery } from '../../../../src/modules/user/repositories/queries/GetUserQuery';
import { UserRepository } from '../../../../src/modules/user/repositories/UserRepository';

process.env.NODE_ENV = 'dev';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.KAFKA_BROKERS = process.env.KAFKA_BROKERS ?? 'localhost:9092';
process.env.KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'test-client';
process.env.PORT = process.env.PORT ?? '3300';
process.env.SYSTEM_USER = process.env.SYSTEM_USER ?? 'system';
process.env.SYSTEM_PASS = process.env.SYSTEM_PASS ?? 'system';

mock.module('../../../../src/db/connection', () => ({
  drizzleDb: {
    query: {
      userSessions: {
        findFirst: mock(async () => ({ id: 's1' })),
      },
    },
  },
}));

const routesPromise = import('../../../../src/modules/user/handlers/user');

describe('user handlers', () => {
  it('creates user successfully', async () => {
    const createUserCommand = {
      execute: mock(async () => ({
        id: 'u2',
        email: 'new@example.com',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };

    const originalGet = Container.get;
    Container.get = mock((token: unknown) => {
      if (token === CreateUserCommand) return createUserCommand;
      return undefined;
    }) as unknown as typeof Container.get;

    const { default: userRoutes } = await routesPromise;
    const secret = configLoader.getConfig().auth.jwt.secret;
    const token = jwt.sign({ sub: 'u1', jti: 's1', email: 'a@b.com', role: 'ADMIN' }, secret);
    const res = await userRoutes.request('/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: 'new@example.com',
        username: 'newuser',
        name: 'New User',
        password: 'StrongPass1!',
      }),
    });
    const body = (await res.json()) as { success: boolean };
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    Container.get = originalGet;
  });

  it('returns user list for admin', async () => {
    const userRepository = {
      findAll: mock(async () => ({ data: [], total: 0 })),
    };
    const originalGet = Container.get;
    Container.get = mock((token: unknown) => {
      if (token === UserRepository) return userRepository;
      return undefined;
    }) as unknown as typeof Container.get;

    const { default: userRoutes } = await routesPromise;
    const secret = configLoader.getConfig().auth.jwt.secret;
    const token = jwt.sign({ sub: 'u1', jti: 's1', email: 'a@b.com', role: 'ADMIN' }, secret);
    const res = await userRoutes.request('/admin/users?page=1&limit=10', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json()) as { success: boolean };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    Container.get = originalGet;
  });

  it('returns current user profile', async () => {
    const getUserQuery = {
      execute: mock(async () => ({
        id: 'u1',
        email: 'a@b.com',
        username: 'user',
        name: 'User',
        role: 'ADMIN',
      })),
    };
    const originalGet = Container.get;
    Container.get = mock((token: unknown) => {
      if (token === GetUserQuery) return getUserQuery;
      return undefined;
    }) as unknown as typeof Container.get;

    const { default: userRoutes } = await routesPromise;
    const secret = configLoader.getConfig().auth.jwt.secret;
    const token = jwt.sign({ sub: 'u1', jti: 's1', email: 'a@b.com', role: 'ADMIN' }, secret);
    const res = await userRoutes.request('/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json()) as { success: boolean };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    Container.get = originalGet;
  });
});
