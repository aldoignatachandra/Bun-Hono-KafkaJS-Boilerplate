import type { NewUser, UpdateUser, UserResponse } from '@cqrs/drizzle';
import { UserRepository as DrizzleUserRepository, type UserRepositoryOptions } from '@cqrs/drizzle';
import { Service } from 'typedi';

// Type for authentication that includes password
export interface UserResponseWithPassword extends UserResponse {
  password: string;
}

@Service()
export class UserRepository {
  private drizzleUserRepository: DrizzleUserRepository;

  constructor() {
    this.drizzleUserRepository = new DrizzleUserRepository();
  }

  async create(data: {
    email: string;
    password: string;
    role?: 'ADMIN' | 'USER';
  }): Promise<UserResponse> {
    return this.drizzleUserRepository.createUser(data as NewUser);
  }

  async findById(id: string, options: UserRepositoryOptions = {}): Promise<UserResponse | null> {
    return this.drizzleUserRepository.findById(id, {
      ...options,
      onlyActive: true, // Default to active records only
    }) as Promise<UserResponse | null>;
  }

  async findByEmail(
    email: string,
    options: UserRepositoryOptions = {},
    includePassword: boolean = false
  ): Promise<UserResponse | null> {
    const selectOptions = includePassword
      ? {
          ...options,
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
          onlyActive: true, // Default to active records only
        }
      : {
          ...options,
          onlyActive: true, // Default to active records only
        };

    return this.drizzleUserRepository.findByEmail(email, selectOptions);
  }

  // Method specifically for authentication that returns user with password
  async findByEmailForAuth(email: string): Promise<UserResponseWithPassword | null> {
    return this.findByEmail(email, {}, true) as Promise<UserResponseWithPassword | null>;
  }

  async update(
    id: string,
    data: Partial<UpdateUser>,
    options: UserRepositoryOptions = {}
  ): Promise<UserResponse | null> {
    return this.drizzleUserRepository.updateUser(id, data as UpdateUser);
  }

  async delete(id: string, force: boolean = false): Promise<boolean> {
    return this.drizzleUserRepository.delete(id, force); // Soft delete by default
  }

  // Restore a soft-deleted user
  async restore(id: string): Promise<boolean> {
    return this.drizzleUserRepository.restore(id);
  }

  // Find a user including deleted records (needed for restore operation)
  async findByIdWithDeleted(id: string): Promise<UserResponse | null> {
    return this.drizzleUserRepository.findById(id, {
      includeDeleted: true,
    }) as Promise<UserResponse | null>;
  }
}
