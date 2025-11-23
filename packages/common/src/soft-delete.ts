import type { SQL } from 'drizzle-orm';
import { and, isNull, not } from 'drizzle-orm';

/**
 * Enhanced Soft Delete Utilities for Drizzle
 *
 * This module provides paranoid/soft delete functionality similar to Sequelize:
 * - Automatic soft delete with audit trail
 * - Paranoid queries (exclude soft-deleted records by default)
 * - Support for force delete
 * - Restore functionality
 * - Include deleted records with paranoid: false option
 */

export interface ParanoidOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  onlyActive?: boolean;
}

/**
 * Create paranoid where clause for queries
 */
export const createParanoidWhereClause = <T extends { deletedAt: any }>(
  table: T,
  options: ParanoidOptions = {}
): SQL<unknown> | undefined => {
  const { includeDeleted, onlyDeleted, onlyActive } = options;

  if (onlyDeleted) {
    return not(isNull(table.deletedAt));
  }

  if (onlyActive || !includeDeleted) {
    return isNull(table.deletedAt);
  }

  return undefined; // Include all records
};

/**
 * Combine paranoid filters with custom where clauses
 */
export const combineWithCustomWhere = <T extends { deletedAt: any }>(
  table: T,
  customWhere: SQL<unknown> | undefined,
  options: ParanoidOptions = {}
): SQL<unknown> | undefined => {
  const paranoidWhere = createParanoidWhereClause(table, options);

  if (customWhere && paranoidWhere) {
    return and(customWhere, paranoidWhere);
  }

  return customWhere || paranoidWhere;
};

/**
 * Helper to find active records
 */
export const active = <T extends { deletedAt: any }>(table: T) => {
  return isNull(table.deletedAt);
};

/**
 * Helper to find deleted records
 */
export const deleted = <T extends { deletedAt: any }>(table: T) => {
  return not(isNull(table.deletedAt));
};

/**
 * Helper to include all records
 */
export const all = <T extends { deletedAt: any }>(_table: T) => {
  return undefined;
};

/**
 * Create count query with paranoid support
 */
export const createCountWhere = <T extends { deletedAt: any }>(
  table: T,
  options: ParanoidOptions = {}
): SQL<unknown> | undefined => {
  return createParanoidWhereClause(table, options);
};

/**
 * Validate paranoid options
 */
export const validateParanoidOptions = (options: ParanoidOptions): void => {
  const { includeDeleted, onlyDeleted, onlyActive } = options;

  const activeOptions = [includeDeleted, onlyDeleted, onlyActive].filter(Boolean).length;

  if (activeOptions > 1) {
    throw new Error('Only one of includeDeleted, onlyDeleted, or onlyActive can be specified');
  }
};

/**
 * Get default paranoid options for queries
 */
export const getDefaultParanoidOptions = (): ParanoidOptions => {
  return {
    onlyActive: true, // Default to active records only
  };
};

/**
 * Merge user options with defaults
 */
export const mergeParanoidOptions = (userOptions: ParanoidOptions = {}): ParanoidOptions => {
  return {
    ...getDefaultParanoidOptions(),
    ...userOptions,
  };
};

/**
 * Helper function to include soft-deleted records
 */
export const includeDeleted = <T extends { deletedAt: any }>(
  table: T
): SQL<unknown> | undefined => {
  return undefined; // Include all records
};

/**
 * Helper function to find only soft-deleted records
 */
export const onlyDeleted = <T extends { deletedAt: any }>(table: T): SQL<unknown> => {
  return not(isNull(table.deletedAt));
};

/**
 * Helper function to find only active (non-deleted) records
 */
export const onlyActive = <T extends { deletedAt: any }>(table: T): SQL<unknown> => {
  return isNull(table.deletedAt);
};

/**
 * Helper function to create paranoid query options
 */
export const paranoidOptions = (
  options: {
    includeDeleted?: boolean;
    onlyDeleted?: boolean;
    onlyActive?: boolean;
  } = {}
): ParanoidOptions => {
  return {
    ...options,
  };
};

/**
 * Helper function for restore operations
 */
export const restoreOptions = (restoredBy?: string): { restoredBy?: string } => {
  return {
    restoredBy,
  };
};

/**
 * Helper function for force delete operations
 */
export const forceDeleteOptions = (deletedBy?: string): { deletedBy?: string } => {
  return {
    deletedBy,
  };
};
