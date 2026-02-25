import { describe, expect, it, mock } from 'bun:test';
import jwt from 'jsonwebtoken';
import { Container } from 'typedi';
import { configLoader } from '../../../../src/config/loader';
import { CreateProductCommand } from '../../../../src/modules/product/repositories/commands/CreateProductCommand';
import { GetProductQuery } from '../../../../src/modules/product/repositories/queries/GetProductQuery';

process.env.NODE_ENV = 'dev';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.KAFKA_BROKERS = process.env.KAFKA_BROKERS ?? 'localhost:9092';
process.env.KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'test-client';
process.env.PORT = process.env.PORT ?? '3200';
process.env.SYSTEM_USER = process.env.SYSTEM_USER ?? 'system';
process.env.SYSTEM_PASS = process.env.SYSTEM_PASS ?? 'system';

const routesPromise = import('../../../../src/modules/product/handlers/product');

describe('product handlers', () => {
  it('creates product successfully', async () => {
    const createdProduct = {
      id: 'p1',
      name: 'Item',
      price: 10,
      ownerId: 'u1',
      stock: 1,
      hasVariant: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const createProductCommand = {
      execute: mock(async () => createdProduct),
    };

    const originalGet = Container.get;
    Container.get = mock((token: unknown) => {
      if (token === CreateProductCommand) return createProductCommand;
      return undefined;
    }) as unknown as typeof Container.get;

    const { default: productRoutes } = await routesPromise;
    const secret = configLoader.getConfig().auth.jwt.secret;
    const token = jwt.sign({ sub: 'u1', jti: 's1', email: 'a@b.com', role: 'USER' }, secret);
    const res = await productRoutes.request('/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Item', price: 10 }),
    });
    const body = (await res.json()) as { success: boolean };
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    Container.get = originalGet;
  });

  it('returns validation error for invalid create payload', async () => {
    const { default: productRoutes } = await routesPromise;
    const secret = configLoader.getConfig().auth.jwt.secret;
    const token = jwt.sign({ sub: 'u1', jti: 's1', email: 'a@b.com', role: 'USER' }, secret);
    const res = await productRoutes.request('/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price: 10 }),
    });
    const body = (await res.json()) as { error: { code: string } };
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when product is not found', async () => {
    const getProductQuery = {
      execute: mock(async () => null),
    };
    const originalGet = Container.get;
    Container.get = mock((token: unknown) => {
      if (token === GetProductQuery) return getProductQuery;
      return undefined;
    }) as unknown as typeof Container.get;

    const { default: productRoutes } = await routesPromise;
    const secret = configLoader.getConfig().auth.jwt.secret;
    const token = jwt.sign({ sub: 'u1', jti: 's1', email: 'a@b.com', role: 'USER' }, secret);
    const res = await productRoutes.request('/products/p1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json()) as { error: { code: string } };
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');

    Container.get = originalGet;
  });
});
