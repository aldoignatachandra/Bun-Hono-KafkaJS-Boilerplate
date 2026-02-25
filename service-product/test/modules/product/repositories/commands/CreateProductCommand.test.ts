import { describe, expect, it, mock, spyOn } from 'bun:test';
import * as productEvents from '../../../../../src/modules/product/events/product-events';
import { CreateProductCommand } from '../../../../../src/modules/product/repositories/commands/CreateProductCommand';

describe('CreateProductCommand', () => {
  it('creates product with variants when provided', async () => {
    const repo = {
      createWithVariants: mock(async () => ({
        id: 'p1',
        name: 'Item',
        price: { min: 10, max: 10, display: '$10.00' },
        ownerId: 'o1',
        stock: 1,
        hasVariant: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })),
      create: mock(async () => undefined),
    };
    const eventSpy = spyOn(productEvents, 'productCreatedProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof productEvents.productCreatedProducer>>
    );
    const command = new CreateProductCommand(repo as never);
    const result = await command.execute({
      name: 'Item',
      price: 10,
      ownerId: 'o1',
      attributes: [{ name: 'Color', values: ['Red'] }],
      variants: [
        { sku: 'SKU1', price: 10, stock: 1, isActive: true, attributeValues: { Color: 'Red' } },
      ],
    });
    expect(result.id).toBe('p1');
    expect(repo.createWithVariants).toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalled();
    eventSpy.mockRestore();
  });

  it('creates product without variants when not provided', async () => {
    const repo = {
      createWithVariants: mock(async () => undefined),
      create: mock(async () => ({
        id: 'p2',
        name: 'Simple',
        price: 10,
        ownerId: 'o1',
        stock: 1,
        hasVariant: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })),
    };
    const eventSpy = spyOn(productEvents, 'productCreatedProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof productEvents.productCreatedProducer>>
    );
    const command = new CreateProductCommand(repo as never);
    const result = await command.execute({
      name: 'Simple',
      price: 10,
      ownerId: 'o1',
      stock: 1,
    });
    expect(result.id).toBe('p2');
    expect(repo.create).toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalled();
    eventSpy.mockRestore();
  });
});
