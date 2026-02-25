import { describe, expect, it, spyOn } from 'bun:test';
import { ProductRepository } from '../../../../src/modules/product/repositories/ProductRepository';
import { ProductRepository as DrizzleProductRepository } from '../../../../src/modules/product/repositories/drizzle-repo';

describe('ProductRepository', () => {
  it('creates products via drizzle repository', async () => {
    const createSpy = spyOn(DrizzleProductRepository.prototype, 'create').mockResolvedValue({
      id: 'p1',
      name: 'Item',
      price: 10,
      ownerId: 'o1',
      stock: 1,
      hasVariant: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as never);

    const repo = new ProductRepository();
    const result = await repo.create({ name: 'Item', price: 10, ownerId: 'o1', stock: 1 });
    expect(result.id).toBe('p1');

    createSpy.mockRestore();
  });

  it('delegates findById to drizzle repository', async () => {
    const findSpy = spyOn(DrizzleProductRepository.prototype, 'findById').mockResolvedValue({
      id: 'p1',
    } as never);

    const repo = new ProductRepository();
    const result = await repo.findById('p1');
    expect(result?.id).toBe('p1');

    findSpy.mockRestore();
  });

  it('delegates update, delete, and restore operations', async () => {
    const updateSpy = spyOn(DrizzleProductRepository.prototype, 'update').mockResolvedValue({
      id: 'p1',
      price: 12,
    } as never);
    const softDeleteSpy = spyOn(DrizzleProductRepository.prototype, 'softDelete').mockResolvedValue(
      true as never
    );
    const hardDeleteSpy = spyOn(DrizzleProductRepository.prototype, 'hardDelete').mockResolvedValue(
      true as never
    );
    const restoreSpy = spyOn(DrizzleProductRepository.prototype, 'restore').mockResolvedValue(
      true as never
    );

    const repo = new ProductRepository();
    const updated = await repo.update('p1', { price: 12 } as never);
    const softDeleted = await repo.delete('p1');
    const hardDeleted = await repo.delete('p1', true);
    const restored = await repo.restore('p1');

    expect(updated?.id).toBe('p1');
    expect(softDeleted).toBe(true);
    expect(hardDeleted).toBe(true);
    expect(restored).toBe(true);

    updateSpy.mockRestore();
    softDeleteSpy.mockRestore();
    hardDeleteSpy.mockRestore();
    restoreSpy.mockRestore();
  });

  it('delegates variant-aware repository methods', async () => {
    const createWithVariantsSpy = spyOn(
      DrizzleProductRepository.prototype,
      'createWithVariants'
    ).mockResolvedValue({
      id: 'p1',
      name: 'Item',
      price: { min: 10, max: 10, display: '$10.00' },
      ownerId: 'o1',
      stock: 1,
      hasVariant: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      attributes: [],
      variants: [],
    } as never);
    const updateWithVariantsSpy = spyOn(
      DrizzleProductRepository.prototype,
      'updateWithVariants'
    ).mockResolvedValue({
      id: 'p1',
      name: 'Item',
      price: { min: 10, max: 10, display: '$10.00' },
      ownerId: 'o1',
      stock: 1,
      hasVariant: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      attributes: [],
      variants: [],
    } as never);
    const findWithVariantsSpy = spyOn(
      DrizzleProductRepository.prototype,
      'findByIdWithVariants'
    ).mockResolvedValue({
      id: 'p1',
      name: 'Item',
      price: { min: 10, max: 10, display: '$10.00' },
      ownerId: 'o1',
      stock: 1,
      hasVariant: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      attributes: [],
      variants: [],
    } as never);
    const findWithFiltersVariantsSpy = spyOn(
      DrizzleProductRepository.prototype,
      'findWithFiltersAndVariants'
    ).mockResolvedValue({ data: [], total: 0 } as never);

    const repo = new ProductRepository();
    const created = await repo.createWithVariants({
      name: 'Item',
      price: 10,
      ownerId: 'o1',
      stock: 1,
      attributes: [],
      variants: [],
    });
    const updated = await repo.updateWithVariants('p1', {
      name: 'Item',
    });
    const found = await repo.findByIdWithVariants('p1');
    const filtered = await repo.findWithFiltersAndVariants({ ownerId: 'o1' });

    expect(created.id).toBe('p1');
    expect(updated?.id).toBe('p1');
    expect(found?.id).toBe('p1');
    expect(filtered.total).toBe(0);

    createWithVariantsSpy.mockRestore();
    updateWithVariantsSpy.mockRestore();
    findWithVariantsSpy.mockRestore();
    findWithFiltersVariantsSpy.mockRestore();
  });

  it('routes query helpers to filter options', async () => {
    const repo = new ProductRepository();
    const findWithFiltersSpy = spyOn(repo, 'findWithFilters').mockResolvedValue({
      data: [],
      total: 0,
    });

    await repo.findByOwner('o1', { limit: 5 });
    await repo.findUserProductsOptimized('o1', { offset: 10 });
    await repo.findDeletedByOwner('o1');
    await repo.findByOwnerWithDeleted('o1');
    await repo.findDeletedOnly({ limit: 1 });
    await repo.findByPriceRange({ min: 1, max: 10 });
    await repo.findByPriceRangeWithDeleted({ min: 1 });
    await repo.findByVariantStatus(true);
    await repo.findInStock();

    expect(findWithFiltersSpy).toHaveBeenCalled();
    findWithFiltersSpy.mockRestore();
  });
});
