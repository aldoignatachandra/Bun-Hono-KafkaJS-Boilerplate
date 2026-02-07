import { text, varchar } from 'drizzle-orm/pg-core';
import { BaseParanoidEntity, createParanoidTable } from '../../../helpers/schema/base-table';
import { roleEnum } from '../../../helpers/schema/enums';

// User table schema
export const users = createParanoidTable('users', {
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum,
});

// TypeScript types for User entity
export type User = typeof users.$inferSelect; // Select type
export type NewUser = typeof users.$inferInsert; // Insert type
export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// Enhanced user types with paranoid support
export interface UserEntity extends BaseParanoidEntity {
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'USER';
}

// User query types
export interface UserQueryOptions {
  includeProducts?: boolean;
  paranoid?: {
    includeDeleted?: boolean;
    onlyDeleted?: boolean;
    onlyActive?: boolean;
  };
  limit?: number;
  offset?: number;
  orderBy?: 'email' | 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

// User response types
export interface UserResponse {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface UserWithProductsResponse extends UserResponse {
  products: ProductResponse[];
}

// Forward declaration for ProductResponse
interface ProductResponse {
  id: string;
  name: string;
  price: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
