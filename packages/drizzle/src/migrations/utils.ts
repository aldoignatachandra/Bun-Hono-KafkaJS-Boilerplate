import { createHash } from 'crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { MigrationFile, MigrationMetadata, MigrationValidationResult } from './types';

/**
 * Calculate MD5 checksum for migration content
 */
export function calculateChecksum(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Generate timestamp for migration naming
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace(/T/g, '').substring(0, 15);
}

/**
 * Parse migration name from directory name
 */
export function parseMigrationName(dirName: string): string {
  const parts = dirName.split('_');
  return parts.slice(1).join('_');
}

/**
 * Extract timestamp from migration directory name
 */
export function extractTimestamp(dirName: string): string {
  const parts = dirName.split('_');
  return parts[0] || '';
}

/**
 * Validate migration directory name format
 */
export function isValidMigrationDirName(name: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}_[a-zA-Z0-9_-]+$/;
  return pattern.test(name);
}

/**
 * Load migration metadata from TOML file
 */
export function loadMigrationMetadata(migrationDir: string): MigrationMetadata {
  const tomlPath = join(migrationDir, 'migration.toml');

  if (!existsSync(tomlPath)) {
    // Generate basic metadata if TOML doesn't exist
    const dirName = basename(migrationDir);
    const name = parseMigrationName(dirName);
    const timestamp = extractTimestamp(dirName);

    return {
      id: dirName,
      name,
      version: '1.0.0',
      createdAt: new Date(
        timestamp
          .replace(/-/g, ':')
          .replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:00')
      ).toISOString(),
    };
  }

  const tomlContent = readFileSync(tomlPath, 'utf-8');

  // Simple TOML parsing (basic implementation)
  const lines = tomlContent.split('\n');
  const metadata: any = {};

  let currentSection = '';
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('[migration]')) {
      currentSection = 'migration';
      metadata.migration = {};
    } else if (trimmed.startsWith('[dependencies]')) {
      currentSection = 'dependencies';
      metadata.dependencies = {};
    } else if (trimmed.startsWith('[features]')) {
      currentSection = 'features';
      metadata.features = {};
    } else if (trimmed.includes(' = ')) {
      const [key, value] = trimmed.split('=').map(s => s.trim());
      const cleanValue = value.replace(/"/g, '');

      if (currentSection === 'migration') {
        metadata.migration[key] = cleanValue;
      } else if (currentSection === 'dependencies') {
        metadata.dependencies[key] = cleanValue;
      } else if (currentSection === 'features') {
        metadata.features[key] = cleanValue === 'true';
      }
    }
  }

  // Ensure required fields
  const dirName = basename(migrationDir);
  return {
    id: metadata.migration?.id || dirName,
    name: metadata.migration?.name || parseMigrationName(dirName),
    description: metadata.migration?.description,
    version: metadata.migration?.version || '1.0.0',
    createdAt: metadata.migration?.created_at || new Date().toISOString(),
    dependencies: Object.values(metadata.dependencies || {}),
    features: metadata.features || {},
    environment: metadata.migration?.environment,
  };
}

/**
 * Load migration SQL from file
 */
export function loadMigrationSQL(migrationDir: string): string {
  const sqlPath = join(migrationDir, 'migration.sql');
  if (!existsSync(sqlPath)) {
    throw new Error(`Migration SQL file not found: ${sqlPath}`);
  }
  return readFileSync(sqlPath, 'utf-8');
}

/**
 * Load migration down SQL from file
 */
export function loadMigrationDownSQL(migrationDir: string): string | undefined {
  const downPath = join(migrationDir, 'down.sql');
  if (!existsSync(downPath)) {
    return undefined;
  }
  return readFileSync(downPath, 'utf-8');
}

/**
 * Get all migration directories in order
 */
export function getMigrationDirectories(migrationsPath: string): string[] {
  if (!existsSync(migrationsPath)) {
    return [];
  }

  const items = readdirSync(migrationsPath, { withFileTypes: true })
    .filter(item => {
      const itemPath = join(migrationsPath, item.name);
      return statSync(itemPath).isDirectory() && isValidMigrationDirName(item.name);
    })
    .sort((a, b) => {
      // Sort by timestamp (numeric prefix)
      const aTimestamp = extractTimestamp(a.name);
      const bTimestamp = extractTimestamp(b.name);
      return aTimestamp.localeCompare(bTimestamp);
    });

  return items.map(item => item.name);
}

/**
 * Load complete migration file information
 */
export function loadMigrationFile(migrationsPath: string, migrationDir: string): MigrationFile {
  const fullPath = join(migrationsPath, migrationDir);
  const metadata = loadMigrationMetadata(fullPath);
  const sql = loadMigrationSQL(fullPath);
  const downSql = loadMigrationDownSQL(fullPath);

  return {
    name: migrationDir,
    path: fullPath,
    sql,
    downSql,
    metadata,
  };
}

/**
 * Create migration directory structure
 */
export function createMigrationDirectory(
  migrationsPath: string,
  name: string,
  sql: string,
  downSql?: string,
  metadata?: Partial<MigrationMetadata>
): string {
  const timestamp = generateTimestamp();
  const migrationDir = `${timestamp}_${name}`;
  const migrationPath = join(migrationsPath, migrationDir);

  // Create directory
  mkdirSync(migrationPath, { recursive: true });

  // Write migration SQL
  writeFileSync(join(migrationPath, 'migration.sql'), sql);

  // Write down SQL if provided
  if (downSql) {
    writeFileSync(join(migrationPath, 'down.sql'), downSql);
  }

  // Write metadata TOML
  const tomlContent = generateTOMLMetadata(migrationDir, name, metadata);
  writeFileSync(join(migrationPath, 'migration.toml'), tomlContent);

  return migrationDir;
}

/**
 * Generate TOML metadata content
 */
function generateTOMLMetadata(
  id: string,
  name: string,
  metadata?: Partial<MigrationMetadata>
): string {
  const timestamp = new Date().toISOString();
  const defaultMetadata = {
    id,
    name,
    version: '1.0.0',
    created_at: timestamp,
    description: metadata?.description || '',
    environment: metadata?.environment || '',
  };

  let toml = '[migration]\n';
  for (const [key, value] of Object.entries(defaultMetadata)) {
    if (value !== undefined && value !== '') {
      toml += `${key} = "${value}"\n`;
    }
  }

  if (metadata?.dependencies && metadata.dependencies.length > 0) {
    toml += '\n[dependencies]\n';
    metadata.dependencies.forEach((dep, index) => {
      toml += `dep_${index + 1} = "${dep}"\n`;
    });
  }

  if (metadata?.features && Object.keys(metadata.features).length > 0) {
    toml += '\n[features]\n';
    for (const [key, value] of Object.entries(metadata.features)) {
      toml += `${key} = ${value}\n`;
    }
  }

  return toml;
}

/**
 * Validate migration file structure
 */
export function validateMigration(migrationFile: MigrationFile): MigrationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!migrationFile.metadata.name) {
    errors.push('Migration name is required');
  }

  if (!migrationFile.metadata.version) {
    errors.push('Migration version is required');
  }

  if (!migrationFile.sql.trim()) {
    errors.push('Migration SQL cannot be empty');
  }

  // Check directory name format
  if (!isValidMigrationDirName(migrationFile.name)) {
    errors.push('Invalid migration directory name format');
  }

  // Check for common SQL patterns
  const sql = migrationFile.sql.toLowerCase();
  if (sql.includes('drop table') && !migrationFile.downSql) {
    warnings.push('DROP TABLE detected but no down migration provided');
  }

  if (sql.includes('alter table') && !migrationFile.downSql) {
    warnings.push('ALTER TABLE detected but no down migration provided');
  }

  // Check dependencies
  const dependencies = migrationFile.metadata.dependencies || [];
  if (dependencies.length > 0) {
    // Dependencies validation would require checking against other migrations
    // This is a placeholder for future implementation
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    dependencies,
    missingDependencies: [], // Would be populated with actual dependency checking
  };
}

/**
 * Split SQL into individual statements
 */
export function splitSQLStatements(sql: string): string[] {
  const rawStatements = sql.split(';');

  return rawStatements
    .map(stmt => stmt.trim())
    .filter(stmt => {
      // Filter out empty statements and pure comments
      if (stmt.length === 0) return false;

      // Remove comment lines from multi-line statements
      const lines = stmt.split('\n');
      const nonCommentLines = lines.filter(line => !line.trim().startsWith('--'));
      return nonCommentLines.length > 0;
    })
    .map(stmt => {
      // Remove comment lines from the statement
      const lines = stmt.split('\n');
      const nonCommentLines = lines.filter(line => !line.trim().startsWith('--'));
      const cleanStatement = nonCommentLines.join('\n').trim();
      return cleanStatement.endsWith(';') ? cleanStatement : cleanStatement + ';';
    })
    .filter(stmt => stmt.length > 0 && stmt !== ';'); // Ensure each statement ends with semicolon and is not empty
}

/**
 * Check if SQL statement is safe to execute multiple times (idempotent)
 */
export function isIdempotentSQL(statement: string): boolean {
  const lowerStatement = statement.toLowerCase().trim();

  // Common idempotent patterns
  const idempotentPatterns = [
    'create table if not exists',
    'create index if not exists',
    'drop table if exists',
    'drop index if exists',
    'alter table ... add column if not exists',
    'insert ... on conflict do nothing',
    'update ... where',
    'delete ... where',
  ];

  return idempotentPatterns.some(pattern => lowerStatement.includes(pattern));
}

/**
 * Format execution time for display
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

/**
 * Generate migration template SQL
 */
export function generateMigrationTemplate(name: string): { up: string; down: string } {
  const timestamp = new Date().toISOString();

  const up = `-- Migration: ${name}
-- Created at: ${timestamp}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE "new_table" (
--     "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
--     "name" TEXT NOT NULL,
--     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMP(3) NOT NULL,
--     "deleted_at" TIMESTAMP(3),
--
--     CONSTRAINT "new_table_pkey" PRIMARY KEY ("id")
-- );

-- Create indexes
-- CREATE INDEX "new_table_deleted_at_idx" ON "new_table"("deleted_at");
-- CREATE INDEX "new_table_name_idx" ON "new_table"("name");
`;

  const down = `-- Down migration for ${name}
-- Created at: ${timestamp}

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS "new_table" CASCADE;
`;

  return { up, down };
}
