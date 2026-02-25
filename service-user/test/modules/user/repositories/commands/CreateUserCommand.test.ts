import { describe, expect, it, mock, spyOn } from 'bun:test';
import * as passwordHelper from '../../../../../src/helpers/password';
import * as userEvents from '../../../../../src/modules/user/events/user-events';
import { CreateUserCommand } from '../../../../../src/modules/user/repositories/commands/CreateUserCommand';

describe('CreateUserCommand', () => {
  it('hashes password and publishes event', async () => {
    const repo = {
      create: mock(async () => ({
        id: 'u1',
        email: 'user@example.com',
        username: 'user',
        name: 'User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
    const hashSpy = spyOn(passwordHelper, 'hashPassword').mockResolvedValue('hash');
    const eventSpy = spyOn(userEvents, 'userCreatedProducer').mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof userEvents.userCreatedProducer>>
    );
    const command = new CreateUserCommand(repo as never);
    const result = await command.execute({
      email: 'user@example.com',
      username: 'user',
      name: 'User',
      password: 'StrongPass1!',
      role: 'USER',
    });
    expect(result.id).toBe('u1');
    expect(hashSpy).toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalled();
    hashSpy.mockRestore();
    eventSpy.mockRestore();
  });
});
