// Migration options interface
export interface MigrationOptions {
  createOnly?: boolean;
  name?: string;
  rollback?: boolean;
  steps?: number;
  environment?: string;
  dryRun?: boolean;
  force?: boolean;
}

// Migration metadata interface
export interface MigrationMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  dependencies?: string[];
  features?: Record<string, boolean>;
  environment?: string;
}

// Migration file structure
export interface MigrationFile {
  name: string;
  path: string;
  sql: string;
  downSql?: string;
  metadata: MigrationMetadata;
}

// Migration execution result
export interface MigrationResult {
  migrationName: string;
  success: boolean;
  executionTime: number;
  error?: string;
  appliedAt?: Date;
}

// Migration batch result
export interface MigrationBatchResult {
  batchId: string;
  migrations: MigrationResult[];
  totalExecutionTime: number;
  success: boolean;
  startedAt: Date;
  finishedAt?: Date;
}

// Migration status interface
export interface MigrationStatusInfo {
  migrationName: string;
  version: string;
  status: 'pending' | 'applied' | 'failed' | 'rolled_back';
  appliedAt?: Date;
  rolledBackAt?: Date;
  executionTime?: number;
  errorMessage?: string;
  environment?: string;
  batchId?: string;
}

// Rollback options
export interface RollbackOptions {
  steps?: number;
  toMigration?: string;
  batchId?: string;
  force?: boolean;
  dryRun?: boolean;
}

// Migration template options
export interface MigrationTemplateOptions {
  name: string;
  description?: string;
  dependencies?: string[];
  features?: Record<string, boolean>;
  environment?: string;
}

// Migration validation result
export interface MigrationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  dependencies: string[];
  missingDependencies: string[];
  migrationName?: string;
}

// Migration context
export interface MigrationContext {
  environment: string;
  databaseVersion?: string;
  batchId: string;
  dryRun: boolean;
  force: boolean;
}

// Migration execution context
export interface MigrationExecutionContext extends MigrationContext {
  migrationName: string;
  version: string;
  sql: string;
  checksum: string;
}

// Rollback execution context
export interface RollbackExecutionContext {
  environment: string;
  batchId: string;
  dryRun: boolean;
  force: boolean;
  migrationName: string;
  downSql?: string;
}

// Migration history
export interface MigrationHistory {
  migrationName: string;
  version: string;
  status: string;
  startedAt: Date;
  finishedAt?: Date;
  executionTime?: number;
  errorMessage?: string;
  rollbackAt?: Date;
  rollbackError?: string;
  environment?: string;
  batchId?: string;
  batchOrder?: number;
}

// Migration summary
export interface MigrationSummary {
  totalMigrations: number;
  appliedMigrations: number;
  pendingMigrations: number;
  failedMigrations: number;
  rolledBackMigrations: number;
  lastMigration?: MigrationHistory;
  environment?: string;
}

// Migration comparison result
export interface MigrationComparisonResult {
  localMigrations: string[];
  appliedMigrations: string[];
  pendingMigrations: string[];
  extraMigrations: string[];
  conflictingMigrations: string[];
}

// Migration health check result
export interface MigrationHealthCheckResult {
  healthy: boolean;
  issues: string[];
  warnings: string[];
  lastSuccessfulMigration?: Date;
  databaseConnected: boolean;
  trackingTableExists: boolean;
}

// Migration backup options
export interface MigrationBackupOptions {
  includeData?: boolean;
  excludeTables?: string[];
  compress?: boolean;
  outputPath?: string;
}

// Migration restore options
export interface MigrationRestoreOptions {
  backupPath: string;
  includeData?: boolean;
  force?: boolean;
  dryRun?: boolean;
}
