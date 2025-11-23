import { and, eq, gte, inArray, like, lte, or } from 'drizzle-orm';
import type {
  InferSelectModel,
  InferInsertModel,
  InferModel,
} from 'drizzle-orm';
import { drizzleDb } from '../db/connection';

/**
 * Simplified Base Repository
 * Provides basic CRUD operations with paranoid support
 */
export abstract class BaseRepository<TTable extends InferModel<any>, TInsert, TSelect, TUpdate> {
  protected table: TTable;

  constructor(db?: any) {
    // Use the provided db or default to drizzleDb
    this.db = db || drizzleDb;
  }

  /**
   * Find one record by where clause
   */
  protected async findOne(where: any): Promise<TSelect | null> {
    const result = await this.db.select().from(this.table).where(where).limit(1);
    return result[0] || null;
  }

  /**
   * Find many records by where clause
   */
  protected async findMany(where: any = {}, options: any = {}): Promise<TSelect[]> {
    let query = this.db.select().from(this.table).where(where);
    
    // Apply options
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    if (options.orderBy) {
      const [column, direction] = options.orderBy === 'createdAt' ? [this.table.createdAt, options.sortOrder || 'asc'] : 
                              options.orderBy === 'updatedAt' ? [this.table.updatedAt, options.sortOrder || 'asc'] :
                              [this.table.id, options.sortOrder || 'asc'];
      query = query.orderBy(...column as any[], direction as any[]);
    }

    return await query;
  }

  /**
   * Create a new record
   */
  protected async create(data: TInsert): Promise<TSelect> {
    const result = await this.db.insert(this.table).values(data).returning();
    return result[0];
  }

  /**
   * Update a record
   */
  protected async update(id: string, data: TUpdate): Promise<TSelect | null> {
    const result = await this.db
      .update(this.table)
      .set(data)
      .where(eq(this.table.id, id))
      .returning();
    return result[0] || null;
  }

  /**
   * Delete a record (soft delete by default)
   */
  protected async delete(id: string, force: boolean = false): Promise<boolean> {
    if (force) {
      await this.db.delete(this.table).where(eq(this.table.id, id));
    } else {
      await this.db
        .update(this.table)
        .set({ deletedAt: new Date() })
        .where(eq(this.table.id, id));
    }
    return true;
  }

  /**
   * Restore a soft-deleted record
   */
  protected async restore(id: string): Promise<boolean> {
    await this.db
      .update(this.table)
      .set({ deletedAt: null })
      .where(eq(this.table.id, id));
    return true;
  }

  /**
   * Count records by where clause
   */
  protected async count(where: any = {}, options: any = {}): Promise<number> {
    let query = this.db.select({ count: true }).from(this.table).where(where);
    
    // Apply paranoid options
    if (options.onlyActive) {
      query = query.where(or(isNull(this.table.deletedAt), eq(this.table.deletedAt, null)));
    } else if (options.onlyDeleted) {
      query = query.where(and(isNotNull(this.table.deletedAt), eq(this.table.deletedAt, null)));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  /**
   * Find records with pagination
   */
  protected async findWithPagination(
    where: any = {},
    pagination: { limit?: number; offset?: number } = {},
    options: any = {}
  ): Promise<{ data: TSelect[]; total: number }> {
    const whereClause = this.buildWhereClause(where, options);
    const dataQuery = this.db.select().from(this.table).where(whereClause);
    
    if (pagination.limit) {
      dataQuery = dataQuery.limit(pagination.limit);
    }
    
    if (pagination.offset) {
      dataQuery = dataQuery.offset(pagination.offset);
    }

    const data = await dataQuery;
    const total = await this.count(whereClause, options);

    return { data, total };
  }

  /**
   * Build where clause from filters and options
   */
  private buildWhereClause(where: any, options: any): any {
    let conditions = [];

    // Add base where conditions
    if (Object.keys(where).length > 0) {
      conditions.push(and(...Object.entries(where).map(([key, value]) => eq(this.getTableColumn(key), value)));
    }

    // Add paranoid options
    if (options.onlyActive) {
      conditions.push(or(isNull(this.table.deletedAt), eq(this.table.deletedAt, null)));
    } else if (options.onlyDeleted) {
      conditions.push(and(isNotNull(this.table.deletedAt), eq(this.table.deletedAt, null)));
    } else if (options.includeDeleted) {
      // No additional condition needed
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Get table column by name
   */
  private getTableColumn(columnName: string): any {
    switch (columnName) {
      case 'id':
        return this.table.id;
      case 'name':
        return this.table.name;
      case 'price':
        return this.table.price;
      case 'ownerId':
      case 'owner_id':
        return this.table.ownerId;
      case 'email':
        return this.table.email;
      case 'password':
        return this.table.password;
      case 'role':
        return this.table.role;
      case 'createdAt':
        return this.table.createdAt;
      case 'updatedAt':
        return this.table.updatedAt;
      case 'deletedAt':
        return this.table.deletedAt;
      default:
        throw new Error(`Unknown column: ${columnName}`);
    }
  }
}
