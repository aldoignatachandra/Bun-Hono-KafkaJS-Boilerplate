import { describe, expect, it } from 'bun:test';
import { userActivityLogs, users, userSessions } from '../../src/db/schema';

describe('db schema', () => {
  it('exports user tables', () => {
    expect(users).toBeDefined();
    expect(userSessions).toBeDefined();
    expect(userActivityLogs).toBeDefined();
  });
});
