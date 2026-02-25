import { PgTableWithColumns } from 'drizzle-orm/pg-core';
export declare function createParanoidTable<TName extends string>(
  name: TName,
  columns: any,
  extraConfig?: (table: any) => any
): any;
export type ParanoidTable<T extends PgTableWithColumns<any>> = T & {
  deletedAt: Date | null;
};
export interface BaseParanoidEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
export type CreateEntity<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type UpdateEntity<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
export interface ParanoidOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  onlyActive?: boolean;
}
//# sourceMappingURL=base-table.d.ts.map
