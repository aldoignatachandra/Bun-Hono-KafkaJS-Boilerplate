import { describe, expect, it, mock } from 'bun:test';
import { GetUserQuery } from '../../../../../src/modules/user/repositories/queries/GetUserQuery';

describe('GetUserQuery', () => {
  it('fetches by id', async () => {
    const repo = {
      findById: mock(async () => ({ id: 'u1' })),
    };
    const query = new GetUserQuery(repo as never);
    const result = await query.execute('u1');
    expect((result as { id: string }).id).toBe('u1');
  });

  it('fetches with deleted users', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => ({ id: 'u1' })),
    };
    const query = new GetUserQuery(repo as never);
    const result = await query.executeWithDeleted('u1');
    expect(result?.id).toBe('u1');
  });
});
