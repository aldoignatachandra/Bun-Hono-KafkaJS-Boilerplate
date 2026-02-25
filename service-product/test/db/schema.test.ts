import { describe, expect, it } from 'bun:test';
import { productAttributes, productVariants, products } from '../../src/db/schema';

describe('db schema', () => {
  it('exports product tables', () => {
    expect(products).toBeDefined();
    expect(productAttributes).toBeDefined();
    expect(productVariants).toBeDefined();
  });
});
