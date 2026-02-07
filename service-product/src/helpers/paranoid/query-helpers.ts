import type { SQL } from 'drizzle-orm';
import { and, isNull, not } from 'drizzle-orm';

export interface ParanoidOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  onlyActive?: boolean;
}

export class ParanoidQueryBuilder {
  /**
   * Create paranoid where clause
   */
  static createWhereClause<T extends { deletedAt: any }>(
    table: T,
    options: ParanoidOptions = {}
  ): SQL<unknown> | undefined {
    const { includeDeleted, onlyDeleted, onlyActive } = options;

    if (onlyDeleted) {
      return not(isNull(table.deletedAt));
    }

    if (onlyActive || !includeDeleted) {
      return isNull(table.deletedAt);
    }

    return undefined; // Include all records
  }

  /**
   * Combine paranoid filters with custom where clauses
   */
  static combineWithCustomWhere<T extends { deletedAt: any }>(
    table: T,
    customWhere: SQL<unknown> | undefined,
    options: ParanoidOptions = {}
  ): SQL<unknown> | undefined {
    const paranoidWhere = this.createWhereClause(table, options);

    if (customWhere && paranoidWhere) {
      return and(customWhere, paranoidWhere);
    }

    return customWhere || paranoidWhere;
  }

  /**
   * Helper to find active records
   */
  static active<T extends { deletedAt: any }>(table: T) {
    return isNull(table.deletedAt);
  }

  /**
   * Helper to find deleted records
   */
  static deleted<T extends { deletedAt: any }>(table: T) {
    return not(isNull(table.deletedAt));
  }

  /**
   * Helper to include all records
   */
  static all<T extends { deletedAt: any }>(_table: T) {
    return undefined;
  }

  /**
   * Create count query with paranoid support
   */
  static createCountWhere<T extends { deletedAt: any }>(
    table: T,
    options: ParanoidOptions = {}
  ): SQL<unknown> | undefined {
    return this.createWhereClause(table, options);
  }

  /**
   * Validate paranoid options
   */
  static validateOptions(options: ParanoidOptions): void {
    const { includeDeleted, onlyDeleted, onlyActive } = options;

    const activeOptions = [includeDeleted, onlyDeleted, onlyActive].filter(Boolean).length;

    if (activeOptions > 1) {
      throw new Error('Only one of includeDeleted, onlyDeleted, or onlyActive can be specified');
    }
  }

  /**
   * Get default paranoid options for queries
   */
  static getDefaultOptions(): ParanoidOptions {
    return {
      onlyActive: true, // Default to active records only
    };
  }

  /**
   * Merge user options with defaults
   */
  static mergeOptions(userOptions: ParanoidOptions = {}): ParanoidOptions {
    return {
      ...this.getDefaultOptions(),
      ...userOptions,
    };
  }
}
