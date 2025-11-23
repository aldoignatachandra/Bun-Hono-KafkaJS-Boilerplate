// Main package exports
export * from './db/index';
export * from './migrations/index';
export * from './paranoid/index';
export * from './repositories/index';
export * from './schema/index';
// Export specific types to avoid conflicts
export type {
  BatchOptions,
  BatchResult,
  calculatePaginationOffset,
  createPaginatedResult,
  createQueryResult,
  DatabaseConfig,
  DatabaseError,
  DateRange,
  FilterOptions,
  formatExecutionTime,
  IRepository,
  isDatabaseEntity,
  isParanoidEntity,
  isRepositoryOptions,
  isValidDateRange,
  isValidPriceRange,
  QueryResult,
  sanitizeErrorMessage,
  SortOptions,
  TransactionOptions,
} from './types/index';

// Re-export commonly used utilities
export type {
  CreateProductRequest,
  CreateUserRequest,
  NewProduct,
  NewUser,
  Product,
  ProductQueryOptions,
  ProductResponse,
  ProductWithOwnerResponse,
  UpdateProduct,
  UpdateProductRequest,
  UpdateUser,
  UpdateUserRequest,
  User,
  UserQueryOptions,
  UserResponse,
  UserWithProductsResponse,
} from './schema/entities';

// Re-export core types
export type { ParanoidOptions } from './paranoid/query-helpers';
export type { Role } from './schema/core/enums';

// Export database utilities
export { checkDatabaseHealth, closeDatabaseConnection, drizzleDb } from './db/connection';

// Export paranoid utilities
export {
  ParanoidQueryBuilder,
  type ParanoidOptions as DrizzleParanoidOptions,
} from './paranoid/query-helpers';

// Export repository instances
export { productRepository } from './repositories/product-repository';
export { userRepository } from './repositories/user-repository';
