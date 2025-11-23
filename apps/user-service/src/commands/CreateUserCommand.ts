import type { UserResponse } from '@cqrs/drizzle';
import bcrypt from 'bcrypt';
import { Service } from 'typedi';
import { UserEventPublisher } from '../events/UserEventPublisher';
import { UserRepository } from '../repositories/UserRepository';
import { CreateUserInput } from '../validation/auth';

@Service()
export class CreateUserCommand {
  constructor(
    private userRepository: UserRepository,
    private eventPublisher: UserEventPublisher
  ) {}

  async execute(data: CreateUserInput): Promise<UserResponse> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      role: data.role || 'USER',
    });

    // Publish event
    await this.eventPublisher.publishUserCreated(user);

    return user;
  }
}
