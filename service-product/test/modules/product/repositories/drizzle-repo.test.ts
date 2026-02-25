import { describe, expect, it } from 'bun:test';
import { ProductRepository } from '../../../../src/modules/product/repositories/drizzle-repo';

describe('Drizzle ProductRepository', () => {
  it('executes basic queries', async () => {
    const repo = new ProductRepository();
    const byId = await repo.findById('p1');
    const byOwner = await repo.findByOwnerId('o1');
    const all = await repo.findAll();
    const filtered = await repo.findWithFilters({ ownerId: 'o1', search: 'Item', limit: 1, offset: 0 });
    expect(byId?.id).toBe('p1');
    expect(Array.isArray(byOwner)).toBe(true);
    expect(Array.isArray(all)).toBe(true);
    expect(filtered.total).toBeGreaterThanOrEqual(0);
  });

  it('handles create and update flows', async () => {
    const repo = new ProductRepository();
    const created = await repo.create({
      name: 'New Item',
      price: 10,
      ownerId: 'o1',
      stock: 1,
      hasVariant: false,
    });
    expect(created.id).toBeDefined();

    const updated = await repo.update(created.id, { price: 12 });
    expect(updated?.price).toBe(12);
  });

  it('handles delete and restore flows', async () => {
    const repo = new ProductRepository();
    const softDeleted = await repo.softDelete('p1');
    const hardDeleted = await repo.hardDelete('p1');
    const restored = await repo.restore('p1');
    expect(softDeleted).toBe(true);
    expect(hardDeleted).toBe(true);
    expect(restored).toBe(true);
  });

  it('handles variants and attribute flows', async () => {
    const repo = new ProductRepository();
    const withVariants = await repo.createWithVariants({
      name: 'Variant Item',
      price: 10,
      ownerId: 'o1',
      stock: 1,
      attributes: [{ name: 'Color', values: ['Red'] }],
      variants: [
        { sku: 'SKU1', price: 10, stock: 1, isActive: true, attributeValues: { Color: 'Red' } },
      ],
    });
    expect(withVariants.id).toBeDefined();

    const updated = await repo.updateWithVariants(withVariants.id, {
      name: 'Updated Variant Item',
      attributes: [{ name: 'Size', values: ['M'] }],
      variants: [
        { sku: 'SKU1', price: 12, stock: 2, isActive: true, attributeValues: { Size: 'M' } },
      ],
    });
    expect(updated?.id).toBeDefined();

    const full = await repo.findByIdWithVariants(withVariants.id);
    expect(full?.id).toBeDefined();
  });

  it('fetches with filters and variants', async () => {
    const repo = new ProductRepository();
    const result = await repo.findWithFiltersAndVariants({ ownerId: 'o1', includeVariants: true });
    expect(Array.isArray(result.data)).toBe(true);
  });
});
