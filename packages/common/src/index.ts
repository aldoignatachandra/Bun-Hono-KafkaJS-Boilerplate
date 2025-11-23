// Export all common utilities and types
export * from './auth';
export * from './config/loader';
export * from './db';
export * from './di';
export * from './kafka';
export * from './logger';
export * from './paranoid-errors';
export {
  createParanoidListResponse,
  createParanoidOperationResult,
  createParanoidResponse,
  ParanoidMessages,
  ParanoidStatusCodes,
  type ParanoidListResponse,
  type ParanoidOperationResult,
  type ParanoidResponse,
} from './paranoid-responses';
export * from './soft-delete';
export * from './types';

// Helper function to check if Drizzle is available
export const isDrizzleAvailable = (): boolean => {
  try {
    require.resolve('@cqrs/drizzle');
    return true;
  } catch {
    return false;
  }
};

// Lazy loading function for Drizzle utilities
export const loadDrizzle = async () => {
  if (!isDrizzleAvailable()) {
    throw new Error(
      '@cqrs/drizzle package is not available. Please install it to use Drizzle features.'
    );
  }

  // Use dynamic import with type assertion to avoid TypeScript errors
  // Use eval to avoid TypeScript compile-time checking
  const module = await eval('import("@cqrs/drizzle")');
  return module as any;
};

// Type exports that will be available when Drizzle is loaded
export type DrizzleTypes = {
  // Database types from Drizzle
  DatabaseConfig: any;
  TransactionOptions: any;
  QueryResult: any;
  DatabaseError: any;
  IRepository: any;
  RepositoryOptions: any;
  PaginationOptions: any;
  PaginatedResult: any;
  PerformanceMetrics: any;
  HealthCheckResult: any;
  ConnectionPoolConfig: any;
  PoolMetrics: any;
  MigrationStatus: any;
  MigrationOptions: any;
  EventDedupConfig: any;
  EventDedupMetrics: any;
  DateRange: any;
  SortOptions: any;
  FilterOptions: any;
  BatchOptions: any;
  BatchResult: any;
  // Paranoid utilities
  DrizzleParanoidOptions: any;
  // Entity types
  DrizzleUser: any;
  DrizzleProduct: any;
  CreateUserRequest: any;
  UpdateUserRequest: any;
  CreateProductRequest: any;
  UpdateProductRequest: any;
  UserQueryOptions: any;
  ProductQueryOptions: any;
  UserResponse: any;
  ProductResponse: any;
  UserWithProductsResponse: any;
  ProductWithOwnerResponse: any;
};
