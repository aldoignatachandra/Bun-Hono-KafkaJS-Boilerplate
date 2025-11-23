import { and, inArray, like, or } from 'drizzle-orm';
import type {
  NewUser,
  UpdateUser,
  User,
  UserResponse,
  UserWithProductsResponse,
} from '../schema/entities/users';
import { users } from '../schema/entities/users';
import {
  BaseRepository,
  type PaginatedResult,
  type PaginationOptions,
  type RepositoryOptions,
} from './base-repository';

/**
 * Extended repository options for User queries
 */
export interface UserRepositoryOptions extends RepositoryOptions {
  includeProducts?: boolean;
  role?: 'ADMIN' | 'USER';
  emailSearch?: string;
}

/**
 * User statistics interface
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  adminUsers: number;
  regularUsers: number;
  usersWithProducts: number;
}

/**
 * Repository for User entity with paranoid support
 */
export class UserRepository extends BaseRepository<User, NewUser, UpdateUser> {
  protected table = users;
  protected defaultSelect = {
    id: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  };

  constructor(db?: any) {
    super(db);
  }

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
    options: UserRepositoryOptions = {}
  ): Promise<UserResponse | null> {
    return this.findOne({ email }, options) as Promise<UserResponse | null>;
  }

  /**
   * Find users by role
   */
  async findByRole(
    role: 'ADMIN' | 'USER',
    options: UserRepositoryOptions = {}
  ): Promise<UserResponse[]> {
    return this.findMany({ role }, options) as Promise<UserResponse[]>;
  }

  /**
   * Search users by email or role
   */
  async searchUsers(query: string, options: UserRepositoryOptions = {}): Promise<UserResponse[]> {
    const searchCondition = or(
      like(users.email, `%${query}%`),
      like(users.role, `%${query.toUpperCase()}%`)
    );

    return this.findMany(searchCondition, options) as Promise<UserResponse[]>;
  }

  /**
   * Find user with their products
   */
  async findUserWithProducts(
    id: string,
    options: UserRepositoryOptions = {}
  ): Promise<UserWithProductsResponse | null> {
    const user = await this.findById(id, {
      ...options,
      include: {
        products: true,
      },
    });

    if (!user) return null;

    // Type assertion to include products
    return user as UserWithProductsResponse;
  }

  /**
   * Find multiple users with their products
   */
  async findUsersWithProducts(
    where: any = {},
    options: UserRepositoryOptions = {}
  ): Promise<UserWithProductsResponse[]> {
    const users = await this.findMany(where, {
      ...options,
      include: {
        products: true,
      },
    });

    return users as UserWithProductsResponse[];
  }

  /**
   * Create a new user with validation
   */
  async createUser(userData: NewUser, transaction?: any): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email, { transaction });
    if (existingUser) {
      throw new Error(`User with email ${userData.email} already exists`);
    }

    return this.create(userData, transaction) as Promise<UserResponse>;
  }

  /**
   * Update user with validation
   */
  async updateUser(
    id: string,
    userData: UpdateUser,
    transaction?: any
  ): Promise<UserResponse | null> {
    // If updating email, check if it's already taken
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email, { transaction });
      if (existingUser && existingUser.id !== id) {
        throw new Error(`Email ${userData.email} is already taken`);
      }
    }

    return this.update(id, userData, transaction) as Promise<UserResponse | null>;
  }

  /**
   * Update user role
   */
  async updateUserRole(
    id: string,
    role: 'ADMIN' | 'USER',
    transaction?: any
  ): Promise<UserResponse | null> {
    return this.update(id, { role }, transaction) as Promise<UserResponse | null>;
  }

  /**
   * Find users by multiple IDs
   */
  async findByIds(ids: string[], options: UserRepositoryOptions = {}): Promise<UserResponse[]> {
    if (ids.length === 0) return [];

    return this.findMany(inArray(users.id, ids), options) as Promise<UserResponse[]>;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const totalUsers = await this.count();
    const activeUsers = await this.count({}, { onlyActive: true });
    const deletedUsers = await this.count({}, { onlyDeleted: true });
    const adminUsers = await this.count({ role: 'ADMIN' });
    const regularUsers = await this.count({ role: 'USER' });

    // Count users with products (this would require a join query)
    const usersWithProducts = await this.countUsersWithProducts();

    return {
      totalUsers,
      activeUsers,
      deletedUsers,
      adminUsers,
      regularUsers,
      usersWithProducts,
    };
  }

  /**
   * Count users with products (requires join)
   */
  private async countUsersWithProducts(): Promise<number> {
    // This would typically be implemented with a join query
    // For now, we'll use a simpler approach
    const usersWithProducts = await this.findMany(
      {},
      {
        include: { products: true },
      }
    );

    return usersWithProducts.filter(
      user => (user as any).products && (user as any).products.length > 0
    ).length;
  }

  /**
   * Find users created within a date range
   */
  async findUsersByDateRange(
    startDate: Date,
    endDate: Date,
    options: UserRepositoryOptions = {}
  ): Promise<UserResponse[]> {
    const dateCondition = and();
    // This would need proper date comparison operators
    // For now, we'll return all users as a placeholder

    return this.findMany(dateCondition, options) as Promise<UserResponse[]>;
  }

  /**
   * Get recently active users
   */
  async getRecentlyActiveUsers(
    days: number = 7,
    options: UserRepositoryOptions = {}
  ): Promise<UserResponse[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // This would typically filter by last activity timestamp
    // For now, we'll return recently created users
    return this.findMany(
      {},
      {
        ...options,
        orderBy: { createdAt: 'desc' },
        limit: 50,
      }
    ) as Promise<UserResponse[]>;
  }

  /**
   * Bulk update user roles
   */
  async bulkUpdateRole(ids: string[], role: 'ADMIN' | 'USER', transaction?: any): Promise<number> {
    if (ids.length === 0) return 0;

    return this.updateMany(inArray(users.id, ids), { role }, transaction);
  }

  /**
   * Bulk delete users
   */
  async bulkDelete(ids: string[], force: boolean = false, transaction?: any): Promise<number> {
    if (ids.length === 0) return 0;

    return this.deleteMany(inArray(users.id, ids), force, transaction);
  }

  /**
   * Find administrators
   */
  async findAdministrators(options: UserRepositoryOptions = {}): Promise<UserResponse[]> {
    return this.findByRole('ADMIN', options);
  }

  /**
   * Find regular users
   */
  async findRegularUsers(options: UserRepositoryOptions = {}): Promise<UserResponse[]> {
    return this.findByRole('USER', options);
  }

  /**
   * Promote user to admin
   */
  async promoteToAdmin(id: string, transaction?: any): Promise<UserResponse | null> {
    return this.updateUserRole(id, 'ADMIN', transaction);
  }

  /**
   * Demote admin to user
   */
  async demoteToUser(id: string, transaction?: any): Promise<UserResponse | null> {
    return this.updateUserRole(id, 'USER', transaction);
  }

  /**
   * Find users with pagination and enhanced filtering
   */
  async findUsersWithPagination(
    where: any = {},
    pagination: PaginationOptions,
    options: UserRepositoryOptions = {}
  ): Promise<PaginatedResult<UserResponse>> {
    return this.findWithPagination(
      where,
      pagination,
      options
    ) as unknown as PaginatedResult<UserResponse>;
  }

  /**
   * Validate user data before creation/update
   */
  private validateUserData(userData: Partial<NewUser | UpdateUser>): void {
    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.role && !['ADMIN', 'USER'].includes(userData.role)) {
      throw new Error('Invalid role. Must be ADMIN or USER');
    }
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Soft delete user and optionally their products
   */
  async deleteUserWithProducts(
    id: string,
    deleteProducts: boolean = false,
    transaction?: any
  ): Promise<boolean> {
    return this.executeInTransaction(async tx => {
      // If requested, delete user's products first
      if (deleteProducts) {
        // This would require importing the product repository
        // For now, we'll just delete the user
      }

      // Delete the user
      return this.delete(id, false, tx);
    });
  }

  /**
   * Restore user and optionally their products
   */
  async restoreUserWithProducts(
    id: string,
    restoreProducts: boolean = false,
    transaction?: any
  ): Promise<boolean> {
    return this.executeInTransaction(async tx => {
      // If requested, restore user's products first
      if (restoreProducts) {
        // This would require importing the product repository
        // For now, we'll just restore the user
      }

      // Restore the user
      return this.restore(id, tx);
    });
  }
}

// Export singleton instance
export const userRepository = new UserRepository();

// Export types
// Types are already exported above
