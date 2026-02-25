import { describe, expect, it } from 'bun:test';
import { productAttributes } from '../../../../src/modules/product/domain/schema-attributes';

describe('schema-attributes', () => {
  it('exports productAttributes table', () => {
    expect(productAttributes).toBeDefined();
  });
});
