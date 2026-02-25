import { describe, expect, it, mock, spyOn } from 'bun:test';
import { DeleteUserCommand } from '../../../../../src/modules/user/repositories/commands/DeleteUserCommand';
import * as userEvents from '../../../../../src/modules/user/events/user-events';

describe('DeleteUserCommand', () => {
  it('rejects when user is missing', async () => {
    const repo = {
      findById: mock(async () => null),
      delete: mock(async () => false),
    };
    const command = new DeleteUserCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('u1', { sub: 'admin', role: 'ADMIN' });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('rejects self deletion', async () => {
    const repo = {
      findById: mock(async () => ({ id: 'u1', role: 'USER', deletedAt: null })),
      delete: mock(async () => false),
    };
    const command = new DeleteUserCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('u1', { sub: 'u1', role: 'ADMIN' });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('rejects deleting admins', async () => {
    const repo = {
      findById: mock(async () => ({ id: 'u2', role: 'ADMIN', deletedAt: null })),
      delete: mock(async () => false),
    };
    const command = new DeleteUserCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('u2', { sub: 'u1', role: 'ADMIN' });
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('deletes user and publishes event', async () => {
    const repo = {
      findById: mock(async () => ({ id: 'u2', role: 'USER', deletedAt: null })),
      delete: mock(async () => true),
    };
    const eventSpy = spyOn(userEvents, 'userDeletedProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof userEvents.userDeletedProducer>>
    );
    const command = new DeleteUserCommand(repo as never);
    const result = await command.execute('u2', { sub: 'u1', role: 'ADMIN' });
    expect(result).toBe(true);
    expect(eventSpy).toHaveBeenCalled();
    eventSpy.mockRestore();
  });
});
