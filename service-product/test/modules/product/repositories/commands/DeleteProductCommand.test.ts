import { describe, expect, it, mock, spyOn } from 'bun:test';
import { DeleteProductCommand } from '../../../../../src/modules/product/repositories/commands/DeleteProductCommand';
import * as productEvents from '../../../../../src/modules/product/events/product-events';

describe('DeleteProductCommand', () => {
  it('rejects when product is missing or not owned', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => null),
      delete: mock(async () => undefined),
    };
    const command = new DeleteProductCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('p1', 'o1');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('rejects already deleted product', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => ({ id: 'p1', ownerId: 'o1', deletedAt: new Date() })),
      delete: mock(async () => undefined),
    };
    const command = new DeleteProductCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('p1', 'o1');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('deletes product and publishes event', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => ({ id: 'p1', ownerId: 'o1', deletedAt: null })),
      delete: mock(async () => undefined),
    };
    const eventSpy = spyOn(productEvents, 'productDeletedProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof productEvents.productDeletedProducer>>
    );
    const command = new DeleteProductCommand(repo as never);
    await command.execute('p1', 'o1');
    expect(repo.delete).toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalled();
    eventSpy.mockRestore();
  });
});
