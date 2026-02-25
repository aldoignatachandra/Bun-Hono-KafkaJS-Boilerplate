import { describe, expect, it } from 'bun:test';
import { ParanoidQueryBuilder } from '../../../src/helpers/paranoid/query-helpers';

describe('ParanoidQueryBuilder', () => {
  it('creates where clause for only deleted', () => {
    const table = { deletedAt: 'deleted_at' } as unknown as { deletedAt: string };
    const clause = ParanoidQueryBuilder.createWhereClause(table, { onlyDeleted: true });
    expect(clause).toBeDefined();
  });

  it('combines custom and paranoid where clauses', () => {
    const table = { deletedAt: 'deleted_at' } as unknown as { deletedAt: string };
    const clause = ParanoidQueryBuilder.combineWithCustomWhere(table, undefined, {
      onlyActive: true,
    });
    expect(clause).toBeDefined();
  });

  it('validates options to prevent conflicts', () => {
    let captured: unknown;
    try {
      ParanoidQueryBuilder.validateOptions({ includeDeleted: true, onlyActive: true });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });
});
