# Drizzle Migration System

A comprehensive migration system for Drizzle ORM with rollback support, dependency management, and advanced tracking features.

## Features

- **Migration Creation**: Generate new migrations with up and down SQL
- **Migration Execution**: Apply migrations with dependency checking and validation
- **Rollback Support**: Rollback specific migrations, batches, or by steps
- **Status Tracking**: Comprehensive migration status and history tracking
- **Health Monitoring**: System health checks and validation
- **Environment Support**: Environment-specific migration management
- **Batch Operations**: Group migrations into batches for better tracking
- **Safety Features**: Dependency validation, rollback previews, and dry-run modes

## Architecture

The migration system consists of several key components:

### 1. Migration Manager (`migration-manager.ts`)

- Handles migration creation and basic operations
- Provides CLI interface for common migration tasks
- Supports up/down migrations with step limiting

### 2. Migration Runner (`migration-runner.ts`)

- Advanced migration execution with dependency checking
- Validation and health monitoring
- Batch processing and error handling

### 3. Rollback Manager (`rollback-manager.ts`)

- Advanced rollback functionality with targeting options
- Rollback previews and history tracking
- Safety checks and dependency validation

### 4. Migration Types (`types.ts`)

- Comprehensive TypeScript interfaces
- Type-safe migration operations
- Context and result definitions

### 5. Migration Utils (`utils.ts`)

- Utility functions for file operations
- SQL parsing and validation
- Template generation and checksum calculation

## Usage

### Basic Migration Operations

```bash
# Create a new migration
npm run migrate:create -- --name=add_user_profile

# Apply all pending migrations
npm run migrate

# Apply specific number of migrations
npm run migrate -- --steps=3

# Show migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down

# Rollback specific number of migrations
npm run migrate:down -- --steps=2
```

### Advanced Operations

```bash
# Run migrations with validation
npm run migrate:run

# Validate all migrations
npm run migrate:validate

# Show migration summary
npm run migrate:summary

# Perform health check
npm run migrate:health

# Rollback with preview
npm run migrate:preview -- --steps=2

# Rollback to specific migration
npm run migrate:rollback -- --to=2024-01-01-00-00_add_users_table

# Rollback specific batch
npm run migrate:rollback -- --batch=550e8400-e29b-41d4-a716-446655440000

# Show rollback history
npm run migrate:history
```

### Dry Run Operations

```bash
# Dry run migration
npm run migrate -- --dry-run

# Dry run rollback
npm run migrate:rollback -- --dry-run --steps=1
```

## Migration File Structure

Each migration follows this structure:

```
2024-01-01-00-00_add_users_table/
├── migration.sql     # Up migration SQL
├── down.sql          # Down migration SQL (optional)
└── migration.toml    # Migration metadata
```

### Migration SQL Template

```sql
-- Migration: add_users_table
-- Created at: 2024-01-01T00:00:00.000Z

-- Add your migration SQL here
-- Example:
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX "users_email_idx" ON "users"("email");
```

### Down Migration SQL Template

```sql
-- Down migration for add_users_table
-- Created at: 2024-01-01T00:00:00.000Z

-- Add your rollback SQL here
-- Example:
DROP TABLE IF EXISTS "users" CASCADE;
```

### Migration Metadata (TOML)

```toml
[migration]
id = "2024-01-01-00-00_add_users_table"
name = "add_users_table"
version = "1.0.0"
created_at = "2024-01-01T00:00:00.000Z"
description = "Create users table with paranoid support"
environment = ""

[dependencies]
# Optional: specify dependent migrations
# dep_1 = "2023-12-01-00-00_create_base_tables"

[features]
# Optional: feature flags
# soft_delete = true
# audit_trail = false
```

## Migration Tracking

The system maintains a `migration_tracking` table with the following fields:

- `migration_name`: Unique migration identifier
- `version`: Migration version
- `status`: Current status (pending, running, completed, failed, rolled_back)
- `started_at`: When migration started
- `finished_at`: When migration completed
- `execution_time_ms`: Execution time in milliseconds
- `batch_id`: Batch identifier for grouped migrations
- `environment`: Environment where migration was applied
- `checksum`: MD5 checksum of migration SQL
- `error_message`: Error details if failed
- `rollback_at`: When migration was rolled back
- `rollback_error`: Rollback error details

## Safety Features

### Dependency Validation

Migrations can specify dependencies in their metadata:

```toml
[dependencies]
dep_1 = "2023-12-01-00-00_create_base_tables"
dep_2 = "2023-12-15-00-00_add_indexes"
```

The system will:

- Check that all dependencies are applied before running a migration
- Prevent circular dependencies
- Show dependency issues before execution

### Rollback Safety

Before rolling back, the system:

- Checks for down migration files
- Validates rollback dependencies
- Shows preview of what will be rolled back
- Requires `--force` flag to override safety checks

### Dry Run Mode

All operations support dry-run mode:

- Shows what would be executed
- Validates SQL syntax
- Checks dependencies
- No actual database changes

## Environment Support

The system supports environment-specific migrations:

```bash
# Set environment
export NODE_ENV=production

# Run migrations for specific environment
npm run migrate:run

# Environment-specific rollback
npm run migrate:rollback -- --environment=staging
```

## Error Handling

The system provides comprehensive error handling:

### Migration Errors

- Detailed error messages with context
- SQL statement that failed
- Rollback of partially applied migrations
- Error recording in tracking table

### Rollback Errors

- Safe rollback failure handling
- Error recording without affecting other migrations
- Ability to retry failed rollbacks

### Validation Errors

- Pre-execution validation
- SQL syntax checking
- Dependency verification
- Clear error messages with suggestions

## Best Practices

### Migration Naming

- Use descriptive names: `add_user_profile_table`
- Include timestamp prefix (auto-generated)
- Use snake_case for consistency

### SQL Writing

- Use IF EXISTS clauses where appropriate
- Include proper indexes for performance
- Consider rollback scenarios
- Add comments for complex operations

### Dependency Management

- Specify dependencies when needed
- Keep dependency chains short
- Avoid circular dependencies
- Test migrations in order

### Rollback Planning

- Always provide down migrations
- Test rollback procedures
- Consider data migration scenarios
- Document rollback limitations

## Troubleshooting

### Common Issues

1. **Migration not found**: Check file naming and directory structure
2. **Dependency errors**: Verify dependency names and order
3. **SQL syntax errors**: Use dry-run mode to validate
4. **Rollback failures**: Check down migration SQL
5. **Tracking table issues**: Use health check to diagnose

### Recovery Procedures

1. **Failed migration**: Fix SQL and retry, or rollback if needed
2. **Partial migration**: Use rollback to clean state
3. **Lost tracking**: Use reset command in development
4. **Corrupted batch**: Rollback batch and reapply

### Debug Commands

```bash
# Check system health
npm run migrate:health

# Validate all migrations
npm run migrate:validate

# Show detailed status
npm run migrate:summary

# Preview rollback before executing
npm run migrate:preview -- --steps=1
```

## Integration with Drizzle Kit

This migration system integrates with Drizzle Kit:

```bash
# Generate migrations from schema changes
npm run generate

# Push schema changes (development)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

The migration system uses the same configuration as Drizzle Kit and can be used alongside it.
