import { describe, expect, it } from 'bun:test';
import { products } from '../../../../src/modules/product/domain/schema';

describe('schema', () => {
  it('exports products table', () => {
    expect(products).toBeDefined();
  });
});
