import { describe, expect, it } from 'bun:test';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '../../../../src/modules/product/domain/product';

describe('product domain schema', () => {
  it('validates create product input', () => {
    const result = CreateProductSchema.safeParse({ name: 'Item', price: 10 });
    expect(result.success).toBe(true);
  });

  it('allows partial update input', () => {
    const result = UpdateProductSchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });
});
