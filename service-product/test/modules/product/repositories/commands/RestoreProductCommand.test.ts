import { describe, expect, it, mock, spyOn } from 'bun:test';
import { RestoreProductCommand } from '../../../../../src/modules/product/repositories/commands/RestoreProductCommand';
import * as productEvents from '../../../../../src/modules/product/events/product-events';

describe('RestoreProductCommand', () => {
  it('rejects when product is missing', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => null),
      restore: mock(async () => false),
      findById: mock(async () => null),
    };
    const command = new RestoreProductCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('p1', 'o1');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('rejects when product is already active', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => ({ id: 'p1', ownerId: 'o1', deletedAt: null })),
      restore: mock(async () => false),
      findById: mock(async () => null),
    };
    const command = new RestoreProductCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('p1', 'o1');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('restores product and publishes event', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => ({
        id: 'p1',
        ownerId: 'o1',
        deletedAt: new Date(),
        email: 'a@b.com',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      restore: mock(async () => true),
      findById: mock(async () => ({ id: 'p1' })),
    };
    const eventSpy = spyOn(productEvents, 'productRestoredProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof productEvents.productRestoredProducer>>
    );
    const command = new RestoreProductCommand(repo as never);
    const result = await command.execute('p1', 'o1');
    expect(result?.id).toBe('p1');
    expect(eventSpy).toHaveBeenCalled();
    eventSpy.mockRestore();
  });
});
