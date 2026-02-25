import { describe, expect, it } from 'bun:test';
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from '../../../../src/modules/product/validators/product-validators';

describe('product validators', () => {
  it('requires attributes when variants are present', () => {
    const result = createProductSchema.safeParse({
      name: 'Item',
      price: 10,
      variants: [{ sku: 'SKU1', price: 10, stock: 1, isActive: true, attributeValues: {} }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts variants with attributes', () => {
    const result = createProductSchema.safeParse({
      name: 'Item',
      price: 10,
      attributes: [{ name: 'Color', values: ['Red'] }],
      variants: [
        { sku: 'SKU1', price: 10, stock: 1, isActive: true, attributeValues: { Color: 'Red' } },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('requires attributes when updating variants', () => {
    const result = updateProductSchema.safeParse({
      variants: [{ sku: 'SKU1', price: 10, stock: 1, isActive: true, attributeValues: {} }],
    });
    expect(result.success).toBe(false);
  });

  it('transforms query parameters', () => {
    const result = productQuerySchema.parse({
      minPrice: '10',
      maxPrice: '50',
      hasVariant: 'true',
      inStock: 'false',
      limit: '5',
      offset: '10',
    });
    expect(result.minPrice).toBe(10);
    expect(result.maxPrice).toBe(50);
    expect(result.hasVariant).toBe(true);
    expect(result.inStock).toBe(false);
    expect(result.limit).toBe(5);
    expect(result.offset).toBe(10);
  });
});
