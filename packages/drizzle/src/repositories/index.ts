// Base repository
export * from './base-repository';

// Entity repositories
export * from './product-repository';
export * from './user-repository';

// Re-export repository instances
export { productRepository } from './product-repository';
export { userRepository } from './user-repository';

// Export repository types
export type {
  IBaseRepository,
  PaginatedResult,
  PaginationOptions,
  RepositoryOptions,
} from './base-repository';

export type { UserRepositoryOptions, UserStats } from './user-repository';

export type { PriceRange, ProductRepositoryOptions, ProductStats } from './product-repository';
