import { describe, expect, it, mock, spyOn } from 'bun:test';
import { UpdateProductCommand } from '../../../../../src/modules/product/repositories/commands/UpdateProductCommand';
import * as productEvents from '../../../../../src/modules/product/events/product-events';

describe('UpdateProductCommand', () => {
  it('rejects when product is missing or not owned', async () => {
    const repo = {
      findById: mock(async () => null),
      updateWithVariants: mock(async () => undefined),
    };
    const command = new UpdateProductCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('p1', { name: 'Item' }, 'o1');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('updates product and publishes event', async () => {
    const repo = {
      findById: mock(async () => ({ id: 'p1', ownerId: 'o1' })),
      updateWithVariants: mock(async () => ({
        id: 'p1',
        name: 'Item',
        price: { min: 10, max: 10, display: '$10.00' },
        ownerId: 'o1',
        stock: 1,
        hasVariant: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })),
    };
    const eventSpy = spyOn(productEvents, 'productUpdatedProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof productEvents.productUpdatedProducer>>
    );
    const command = new UpdateProductCommand(repo as never);
    const result = await command.execute('p1', { name: 'Item' }, 'o1');
    expect(result.id).toBe('p1');
    expect(eventSpy).toHaveBeenCalled();
    eventSpy.mockRestore();
  });
});
