import { describe, expect, it, mock, spyOn } from 'bun:test';
import { RestoreUserCommand } from '../../../../../src/modules/user/repositories/commands/RestoreUserCommand';
import * as userEvents from '../../../../../src/modules/user/events/user-events';

describe('RestoreUserCommand', () => {
  it('rejects when user is missing', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => null),
      restore: mock(async () => false),
      findById: mock(async () => null),
    };
    const command = new RestoreUserCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('u1');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('rejects when user is already active', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => ({ id: 'u1', deletedAt: null })),
      restore: mock(async () => false),
      findById: mock(async () => null),
    };
    const command = new RestoreUserCommand(repo as never);
    let captured: unknown;
    try {
      await command.execute('u1');
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
  });

  it('restores user and publishes event', async () => {
    const repo = {
      findByIdWithDeleted: mock(async () => ({
        id: 'u1',
        email: 'user@example.com',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      })),
      restore: mock(async () => true),
      findById: mock(async () => ({ id: 'u1' })),
    };
    const eventSpy = spyOn(userEvents, 'userRestoredProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof userEvents.userRestoredProducer>>
    );
    const command = new RestoreUserCommand(repo as never);
    const result = await command.execute('u1');
    expect(result?.id).toBe('u1');
    expect(eventSpy).toHaveBeenCalled();
    eventSpy.mockRestore();
  });
});
