/**
 * Core database types
 */

// Database connection types
export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

// Transaction types
export interface TransactionOptions {
  isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
  readOnly?: boolean;
}

// Query result types
export interface QueryResult<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  affectedRows?: number;
}

// Error types
export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  severity?: string;
  table?: string;
  constraint?: string;
}

/**
 * Repository types
 */

// Forward declaration for DatabaseTransaction
interface DatabaseTransaction {
  execute: (query: string, params?: any[]) => Promise<any>;
  rollback: () => Promise<void>;
  commit: () => Promise<void>;
}

// Base repository interface
export interface IRepository<T, CreateT, UpdateT> {
  findById(id: string, options?: RepositoryOptions): Promise<T | null>;
  findOne(where: any, options?: RepositoryOptions): Promise<T | null>;
  findMany(where?: any, options?: RepositoryOptions): Promise<T[]>;
  create(data: CreateT, transaction?: DatabaseTransaction): Promise<T>;
  createMany(data: CreateT[], transaction?: DatabaseTransaction): Promise<T[]>;
  update(id: string, data: UpdateT, transaction?: DatabaseTransaction): Promise<T | null>;
  updateMany(where: any, data: UpdateT, transaction?: DatabaseTransaction): Promise<number>;
  delete(id: string, force?: boolean, transaction?: DatabaseTransaction): Promise<boolean>;
  deleteMany(where: any, force?: boolean, transaction?: DatabaseTransaction): Promise<number>;
  restore(id: string, transaction?: DatabaseTransaction): Promise<boolean>;
  count(where?: any, options?: RepositoryOptions): Promise<number>;
  exists(where: any, options?: RepositoryOptions): Promise<boolean>;
}

// Repository options
export interface RepositoryOptions {
  include?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  select?: Record<string, boolean>;
  transaction?: any; // Using any to avoid circular dependencies
  paranoid?: {
    includeDeleted?: boolean;
    onlyDeleted?: boolean;
    onlyActive?: boolean;
  };
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Performance monitoring types
 */

// Performance metrics
export interface PerformanceMetrics {
  queryTime: number;
  executionTime: number;
  memoryUsage: number;
  connectionCount: number;
  cacheHitRate?: number;
  indexUsage?: Record<string, number>;
  slowQueries: SlowQuery[];
}

// Slow query information
export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: Date;
  parameters?: any[];
  affectedRows?: number;
  stackTrace?: string;
}

// Performance monitoring options
export interface PerformanceOptions {
  slowQueryThreshold: number;
  enableProfiling: boolean;
  trackMemoryUsage: boolean;
  trackConnections: boolean;
  maxSlowQueries: number;
  enableStackTrace?: boolean;
}

// Query statistics
export interface QueryStatistics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueryCount: number;
  fastestQuery: { query: string; time: number } | null;
  slowestQuery: { query: string; time: number } | null;
  queriesPerSecond: number;
  errorRate: number;
}

/**
 * Health monitoring types
 */

// Health check result
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number;
  error?: string;
  details: {
    connection: boolean;
    query: boolean;
    transaction: boolean;
    pool: boolean;
  };
}

// Health thresholds
export interface HealthThresholds {
  maxResponseTime: number;
  maxSlowQueryCount: number;
  maxErrorCount: number;
  minAvailableConnections: number;
  maxMemoryUsage?: number;
  maxCpuUsage?: number;
}

// Database metrics
export interface DatabaseMetrics {
  connectionCount: number;
  activeConnections: number;
  idleConnections: number;
  queryCount: number;
  slowQueryCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastError?: string;
  uptime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * Connection pool types
 */

// Connection pool configuration
export interface ConnectionPoolConfig {
  max: number;
  idle_timeout: number;
  connect_timeout: number;
  max_lifetime: number;
  prepared: boolean;
  types: Record<string, any>;
  onnotice: (notice: any) => void;
  onparameter: (key: string, value: any) => void;
  debug: boolean;
}

// Pool metrics
export interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  averageWaitTime: number;
  totalRequests: number;
}

/**
 * Query builder types
 */

// Query builder interface
export interface IQueryBuilder<T> {
  where(condition: any): IQueryBuilder<T>;
  whereIn(field: keyof T, values: any[]): IQueryBuilder<T>;
  whereLike(field: keyof T, value: string): IQueryBuilder<T>;
  whereNull(field: keyof T): IQueryBuilder<T>;
  whereNotNull(field: keyof T): IQueryBuilder<T>;
  whereBetween(field: keyof T, min: any, max: any): IQueryBuilder<T>;
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): IQueryBuilder<T>;
  limit(count: number): IQueryBuilder<T>;
  offset(count: number): IQueryBuilder<T>;
  include(relations: Record<string, any>): IQueryBuilder<T>;
  select(fields: Record<string, boolean>): IQueryBuilder<T>;
  paranoid(options: any): IQueryBuilder<T>; // Using any to avoid circular dependencies
  build(): any;
  execute(): Promise<T[]>;
  first(): Promise<T | null>;
  count(): Promise<number>;
  exists(): Promise<boolean>;
}

// Join query builder
export interface IJoinQueryBuilder<T1, T2> {
  where(condition: any): IJoinQueryBuilder<T1, T2>;
  select(fields: Record<string, boolean>): IJoinQueryBuilder<T1, T2>;
  execute(): Promise<any[]>;
}

// Aggregation query builder
export interface IAggregationQueryBuilder<T> {
  where(condition: any): IAggregationQueryBuilder<T>;
  groupBy(field: keyof T): IAggregationQueryBuilder<T>;
  count(field?: keyof T, alias?: string): IAggregationQueryBuilder<T>;
  sum(field: keyof T, alias: string): IAggregationQueryBuilder<T>;
  avg(field: keyof T, alias: string): IAggregationQueryBuilder<T>;
  min(field: keyof T, alias: string): IAggregationQueryBuilder<T>;
  max(field: keyof T, alias: string): IAggregationQueryBuilder<T>;
  execute(): Promise<any[]>;
}

/**
 * Entity-specific types
 */

// User statistics
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  adminUsers: number;
  regularUsers: number;
  usersWithProducts: number;
  averageProductsPerUser: number;
  newestUser?: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

// Product statistics
export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  deletedProducts: number;
  totalValue: number;
  averagePrice: number;
  maxPrice: number;
  minPrice: number;
  productsByOwner: Record<string, number>;
  averageProductsPerOwner: number;
  mostExpensiveProduct?: {
    id: string;
    name: string;
    price: number;
    ownerId: string;
  };
  leastExpensiveProduct?: {
    id: string;
    name: string;
    price: number;
    ownerId: string;
  };
}

// Price range
export interface PriceRange {
  min?: number;
  max?: number;
}

/**
 * Migration types
 */

// Migration status
export interface MigrationStatus {
  id: string;
  name: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  appliedAt?: Date;
  rollbackAt?: Date;
  error?: string;
  checksum?: string;
}

// Migration options
export interface MigrationOptions {
  dryRun?: boolean;
  force?: boolean;
  step?: boolean;
  verbose?: boolean;
  targetVersion?: string;
}

/**
 * Event deduplication types
 */

// Event deduplication configuration
export interface EventDedupConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of events to track
  cleanupInterval: number; // Cleanup interval in seconds
}

// Event deduplication metrics
export interface EventDedupMetrics {
  totalEvents: number;
  uniqueEvents: number;
  duplicateEvents: number;
  deduplicationRate: number;
  averageProcessingTime: number;
  cacheSize: number;
  cacheHitRate: number;
}

/**
 * Utility types
 */

// Date range
export interface DateRange {
  start: Date;
  end: Date;
}

// Sort options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Filter options
export interface FilterOptions {
  field: string;
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'notIn'
    | 'like'
    | 'ilike'
    | 'isNull'
    | 'isNotNull';
  value: any;
}

// Batch operation options
export interface BatchOptions {
  batchSize?: number;
  continueOnError?: boolean;
  timeout?: number;
}

// Batch result
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: Error;
  }>;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

/**
 * Type guards and utilities
 */

// Type guard for database entity
export function isDatabaseEntity(
  obj: any
): obj is { id: string; createdAt: Date; updatedAt: Date } {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

// Type guard for paranoid entity
export function isParanoidEntity(obj: any): obj is { deletedAt: Date | null } {
  return (
    obj && typeof obj === 'object' && (obj.deletedAt === null || obj.deletedAt instanceof Date)
  );
}

// Type guard for repository options
export function isRepositoryOptions(obj: any): obj is RepositoryOptions {
  return (
    obj &&
    typeof obj === 'object' &&
    (obj.select === undefined || typeof obj.select === 'object') &&
    (obj.orderBy === undefined || typeof obj.orderBy === 'object') &&
    (obj.limit === undefined || typeof obj.limit === 'number') &&
    (obj.offset === undefined || typeof obj.offset === 'number')
  );
}

// Utility function to create safe query result
export function createQueryResult<T>(
  data: T[],
  total?: number,
  page?: number,
  limit?: number
): QueryResult<T> {
  return {
    data,
    total: total || data.length,
    page,
    limit,
  };
}

// Utility function to create paginated result
export function createPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Utility function to validate date range
export function isValidDateRange(range: DateRange): boolean {
  return range.start instanceof Date && range.end instanceof Date && range.start <= range.end;
}

// Utility function to validate price range
export function isValidPriceRange(range: PriceRange): boolean {
  if (range.min !== undefined && range.min < 0) return false;
  if (range.max !== undefined && range.max < 0) return false;
  if (range.min !== undefined && range.max !== undefined && range.min > range.max) return false;
  return true;
}

// Utility function to calculate pagination offset
export function calculatePaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// Utility function to format execution time
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

// Utility function to sanitize error message
export function sanitizeErrorMessage(error: Error): string {
  return error.message
    .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
    .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
    .replace(/secret\s*=\s*'[^']*'/gi, "secret='***'")
    .replace(/key\s*=\s*'[^']*'/gi, "key='***'");
}
