import { describe, expect, it, mock } from 'bun:test';

const baseUserRow = {
  id: 'u1',
  email: 'user@example.com',
  username: 'user',
  name: 'User',
  role: 'USER',
  password: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const selectMock = mock((args?: Record<string, unknown>) => ({
  from: () => {
    const rows = args && 'count' in args ? [{ count: 1 }] : [baseUserRow];
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
    returning: () =>
      Array.isArray(values)
        ? values.map((val, index) => ({ id: `id-${index}`, ...val }))
        : [{ id: 'id-1', ...values }],
  }),
}));

const updateMock = mock((_table: unknown) => ({
  set: (values: Record<string, unknown>) => ({
    where: () => ({
      returning: () => [{ ...baseUserRow, ...values }],
    }),
  }),
}));

const deleteMock = mock((_table: unknown) => ({
  where: mock(async () => undefined),
}));

const queryUsersFindFirst = mock(async () => null as unknown);

const drizzleDb = {
  select: selectMock,
  insert: insertMock,
  update: updateMock,
  delete: deleteMock,
  query: {
    users: {
      findFirst: queryUsersFindFirst,
    },
  },
};

mock.module('../../../../src/db/connection', () => ({
  drizzleDb,
}));

const repoPromise = import('../../../../src/modules/user/repositories/drizzle-repo');

describe('Drizzle UserRepository', () => {
  it('executes basic queries', async () => {
    const { UserRepository } = await repoPromise;
    const repo = new UserRepository();
    const byId = await repo.findById('u1');
    const byEmail = await repo.findByEmail('user@example.com');
    const byUsername = await repo.findByUsername('user');
    const all = await repo.findAll({ limit: 10, offset: 0 });
    expect(byId?.id).toBe('u1');
    expect(byEmail?.email).toBe('user@example.com');
    expect(byUsername?.username).toBe('user');
    expect(all.total).toBeGreaterThanOrEqual(0);
  });

  it('creates users when no duplicates exist', async () => {
    const { UserRepository } = await repoPromise;
    const repo = new UserRepository();
    queryUsersFindFirst.mockResolvedValueOnce(null);
    const created = await repo.create({
      email: 'new@example.com',
      username: 'newuser',
      name: 'New User',
      password: 'hash',
      role: 'USER',
    });
    expect(created.id).toBeDefined();
  });

  it('throws on duplicate email', async () => {
    const { UserRepository } = await repoPromise;
    const repo = new UserRepository();
    queryUsersFindFirst.mockResolvedValueOnce({
      id: 'u1',
      email: 'dup@example.com',
      username: 'other',
    });
    let captured: unknown;
    try {
      await repo.create({
        email: 'dup@example.com',
        username: 'newuser',
        name: 'New User',
        password: 'hash',
        role: 'USER',
      });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('throws on duplicate username during update', async () => {
    const { UserRepository } = await repoPromise;
    const repo = new UserRepository();
    queryUsersFindFirst.mockResolvedValueOnce({
      id: 'u2',
      email: 'other@example.com',
      username: 'dup',
    });
    let captured: unknown;
    try {
      await repo.update('u1', { username: 'dup' });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('handles delete and restore flows', async () => {
    const { UserRepository } = await repoPromise;
    const repo = new UserRepository();
    const softDeleted = await repo.softDelete('u1');
    const hardDeleted = await repo.hardDelete('u1');
    const restored = await repo.restore('u1');
    expect(softDeleted).toBe(true);
    expect(hardDeleted).toBe(true);
    expect(restored).toBe(true);
  });

  it('returns empty for missing ids', async () => {
    const { UserRepository } = await repoPromise;
    const repo = new UserRepository();
    const result = await repo.findByIds([]);
    expect(result).toEqual([]);
  });
});
