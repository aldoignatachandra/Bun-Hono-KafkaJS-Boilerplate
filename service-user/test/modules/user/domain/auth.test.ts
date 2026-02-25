import { describe, expect, it } from 'bun:test';
import {
  CreateUserSchema,
  LoginSchema,
  UpdateUserSchema,
} from '../../../../src/modules/user/domain/auth';

describe('user auth schema', () => {
  it('validates login schema', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'pass' });
    expect(result.success).toBe(true);
  });

  it('validates create user schema', () => {
    const result = CreateUserSchema.safeParse({
      email: 'user@example.com',
      username: 'user',
      name: 'User',
      password: 'StrongPass1!',
    });
    expect(result.success).toBe(true);
  });

  it('validates update user schema', () => {
    const result = UpdateUserSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });
});
