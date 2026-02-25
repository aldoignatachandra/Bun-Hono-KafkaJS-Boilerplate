import { describe, expect, it } from 'bun:test';
import { users } from '../../../../src/modules/user/domain/schema';

describe('user domain schema', () => {
  it('exports users table', () => {
    expect(users).toBeDefined();
  });
});
