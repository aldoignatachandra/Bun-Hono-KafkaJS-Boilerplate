import { describe, expect, it, spyOn } from 'bun:test';
import { UserRepository } from '../../../../src/modules/user/repositories/UserRepository';
import { UserRepository as DrizzleUserRepository } from '../../../../src/modules/user/repositories/drizzle-repo';

describe('UserRepository', () => {
  it('creates users via drizzle repository', async () => {
    const createSpy = spyOn(DrizzleUserRepository.prototype, 'create').mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      username: 'user',
      name: 'User',
      password: 'hash',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const repo = new UserRepository();
    const result = await repo.create({
      email: 'user@example.com',
      username: 'user',
      name: 'User',
      password: 'hash',
    });
    expect(result.id).toBe('u1');
    createSpy.mockRestore();
  });

  it('delegates findByEmail to drizzle repository', async () => {
    const findSpy = spyOn(DrizzleUserRepository.prototype, 'findByEmail').mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      username: 'user',
      name: 'User',
      password: 'hash',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const repo = new UserRepository();
    const result = await repo.findByEmail('user@example.com');
    expect(result?.email).toBe('user@example.com');
    findSpy.mockRestore();
  });
});
