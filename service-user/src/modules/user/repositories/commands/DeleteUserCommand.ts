import { Service } from 'typedi';
import { userDeletedProducer } from '../../events/user-events';
import { UserRepository } from '../UserRepository';

@Service()
export class DeleteUserCommand {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string, currentUser: { sub: string; role: string }, force: boolean = false) {
    // Check if user exists (including deleted ones to check status)
    const user = await this.userRepository.findById(id, { includeDeleted: true });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent self-deletion
    if (user.id === currentUser.sub) {
      throw new Error('Cannot delete yourself');
    }

    // Prevent deleting other admins
    if (user.role === 'ADMIN') {
      throw new Error('Cannot delete other admins');
    }

    // Check if already deleted (for soft delete)
    if (!force && user.deletedAt) {
      throw new Error('User already deleted');
    }

    const success = await this.userRepository.delete(id, force);

    if (!success) {
      throw new Error('User not found');
    }

    // [Kafka] Send 'user.deleted' event to message broker to notify other services
    await userDeletedProducer(id, force);

    return success;
  }
}
