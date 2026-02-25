import { describe, expect, it, mock } from 'bun:test';
import { GetProductQuery } from '../../../../../src/modules/product/repositories/queries/GetProductQuery';

describe('GetProductQuery', () => {
  it('fetches by id with variants when requested', async () => {
    const repo = {
      findById: mock(async () => ({ id: 'p1' })),
      findByIdWithVariants: mock(async () => ({ id: 'p1', variants: [] })),
    };
    const query = new GetProductQuery(repo as never);
    const result = await query.execute('p1', { includeVariants: true });
    expect((result as { id: string }).id).toBe('p1');
    expect(repo.findByIdWithVariants).toHaveBeenCalled();
  });

  it('fetches by owner', async () => {
    const repo = {
      findByOwner: mock(async () => ({ data: [], total: 0 })),
    };
    const query = new GetProductQuery(repo as never);
    const result = await query.executeByOwner('o1');
    expect(result.total).toBe(0);
  });

  it('delegates query helpers to repository methods', async () => {
    const repo = {
      findById: mock(async () => ({ id: 'p1' })),
      findByIdWithVariants: mock(async () => ({ id: 'p1', variants: [] })),
      findByIdWithDeleted: mock(async () => ({ id: 'p1' })),
      findByOwner: mock(async () => ({ data: [], total: 0 })),
      findUserProductsOptimized: mock(async () => ({ data: [], total: 0 })),
      findByOwnerWithDeleted: mock(async () => ({ data: [], total: 0 })),
      findDeletedByOwner: mock(async () => ({ data: [], total: 0 })),
      findDeletedOnly: mock(async () => ({ data: [], total: 0 })),
      findByPriceRange: mock(async () => ({ data: [], total: 0 })),
      findByPriceRangeWithDeleted: mock(async () => ({ data: [], total: 0 })),
      findWithFilters: mock(async () => ({ data: [], total: 0 })),
    };
    const query = new GetProductQuery(repo as never);

    await query.execute('p1');
    await query.executeWithDeleted('p1');
    await query.executeWithDeleted('p1', { includeVariants: true });
    await query.executeByOwner('o1');
    await query.executeUserProductsOptimized('o1');
    await query.executeByOwnerWithDeleted('o1');
    await query.executeDeletedByOwner('o1');
    await query.executeDeletedOnly();
    await query.executeByPriceRange({ min: 1, max: 10 });
    await query.executeByPriceRangeWithDeleted({ min: 1 });
    await query.executeWithFilters({ ownerId: 'o1', search: 'Item' });

    expect(repo.findById).toHaveBeenCalled();
    expect(repo.findByIdWithDeleted).toHaveBeenCalled();
    expect(repo.findByIdWithVariants).toHaveBeenCalled();
    expect(repo.findByOwner).toHaveBeenCalled();
    expect(repo.findUserProductsOptimized).toHaveBeenCalled();
    expect(repo.findByOwnerWithDeleted).toHaveBeenCalled();
    expect(repo.findDeletedByOwner).toHaveBeenCalled();
    expect(repo.findDeletedOnly).toHaveBeenCalled();
    expect(repo.findByPriceRange).toHaveBeenCalled();
    expect(repo.findByPriceRangeWithDeleted).toHaveBeenCalled();
    expect(repo.findWithFilters).toHaveBeenCalled();
  });
});
