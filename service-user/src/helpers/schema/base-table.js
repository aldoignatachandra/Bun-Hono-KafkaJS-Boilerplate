import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
// Enhanced base table with paranoid/soft delete support
// Note: Using `any` here for simplicity and compatibility with Drizzle's column builder API
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
export function createParanoidTable(name, columns, extraConfig) {
    return pgTable(name, {
        // Base paranoid fields
        id: uuid('id').defaultRandom().primaryKey(),
        createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
            .defaultNow()
            .notNull(),
        deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
        // Custom columns
        ...columns,
    }, table => {
        const extraIndexes = extraConfig ? extraConfig(table) : {};
        return {
            // Paranoid index for efficient soft delete queries
            paranoidIndex: index(`${name}_deleted_at_idx`).on(table.deletedAt),
            // Additional indexes from extraConfig
            ...extraIndexes,
        };
    });
}
//# sourceMappingURL=base-table.js.map