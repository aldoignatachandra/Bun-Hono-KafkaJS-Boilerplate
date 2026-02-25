import { describe, expect, it } from 'bun:test';
import { productVariants } from '../../../../src/modules/product/domain/schema-variants';

describe('schema-variants', () => {
  it('exports productVariants table', () => {
    expect(productVariants).toBeDefined();
  });
});
