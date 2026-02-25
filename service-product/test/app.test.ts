import { describe, expect, it, mock } from 'bun:test';

process.env.NODE_ENV = 'dev';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.KAFKA_BROKERS = process.env.KAFKA_BROKERS ?? 'localhost:9092';
process.env.KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'test-client';
process.env.PORT = process.env.PORT ?? '3200';
process.env.SYSTEM_USER = process.env.SYSTEM_USER ?? 'system';
process.env.SYSTEM_PASS = process.env.SYSTEM_PASS ?? 'system';

const baseProductRow = {
  id: 'p1',
  name: 'Item',
  price: 10,
  ownerId: 'o1',
  stock: 1,
  hasVariant: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const selectMock = mock((args?: Record<string, unknown>) => ({
  from: () => {
    const rows =
      args && 'count' in args
        ? [{ count: 1 }]
        : args && 'productId' in args
          ? [{ productId: 'p1', price: 10 }]
          : [baseProductRow];
    const chain = rows as unknown as {
      where: () => unknown;
      limit: () => unknown;
      offset: () => unknown;
    };
    chain.where = () => chain;
    chain.limit = () => chain;
    chain.offset = () => chain;
    return chain;
  },
}));

const insertMock = mock((_table: unknown) => ({
  values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => ({
    returning: () => {
      const withReserved = (val: Record<string, unknown>, index: number) => ({
        id: `id-${index}`,
        stockReserved: 0,
        ...val,
      });
      return Array.isArray(values)
        ? values.map((val, index) => withReserved(val, index))
        : [withReserved(values, 1)];
    },
  }),
}));

const updateMock = mock((_table: unknown) => ({
  set: (values: Record<string, unknown>) => ({
    where: () => ({
      returning: () => [{ ...baseProductRow, ...values }],
    }),
  }),
}));

const deleteMock = mock((_table: unknown) => ({
  where: mock(async () => undefined),
}));

const drizzleDb = {
  select: selectMock,
  insert: insertMock,
  update: updateMock,
  delete: deleteMock,
} as {
  select: typeof selectMock;
  insert: typeof insertMock;
  update: typeof updateMock;
  delete: typeof deleteMock;
  transaction?: (cb: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
};
drizzleDb.transaction = async (cb: (tx: unknown) => Promise<unknown>) => cb(drizzleDb);

mock.module('../src/db/connection', () => ({
  checkDatabaseHealth: mock(async () => true),
  drizzleDb,
  client: {},
  closeDatabaseConnection: mock(async () => undefined),
}));

const appPromise = import('../src/app');
const configPromise = import('../src/config/loader');

describe('app', () => {
  it('returns health status', async () => {
    const { default: app } = await appPromise;
    const res = await app.request('/health');
    const body = (await res.json()) as { success: boolean; data: { service: string } };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.service).toBe('product-service');
  });

  it('returns admin health with system auth', async () => {
    const { configLoader } = await configPromise;
    const config = configLoader.getConfig();
    const username = config.security?.systemAuth?.username ?? 'SYSTEM_USER';
    const password = config.security?.systemAuth?.password ?? 'SYSTEM_PASS';
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const { default: app } = await appPromise;
    const res = await app.request('/admin/health', {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
    expect(res.status).toBe(200);
  });
});
