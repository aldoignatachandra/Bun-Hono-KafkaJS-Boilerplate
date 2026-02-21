import { index, jsonb, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createParanoidTable } from '../../../helpers/schema/base-table';
import { roleEnum } from '../../../helpers/schema/enums';
export { roleEnum } from '../../../helpers/schema/enums';
// User table schema
export const users = createParanoidTable('users', {
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    password: text('password').notNull(),
    role: roleEnum('role'),
}, table => ({
    roleIdx: index('users_role_idx').on(table.role),
    usernameIdx: index('users_username_idx').on(table.username),
}));
// User Session Schema (Synced with service-auth)
export const userSessions = createParanoidTable('user_sessions', {
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    deviceType: varchar('device_type', { length: 50 }),
    expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { mode: 'date', withTimezone: true }).defaultNow(),
}, table => ({
    userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
}));
// User Activity Log Schema
export const userActivityLogs = createParanoidTable('user_activity_logs', {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 255 }).notNull(), // e.g., 'auth.login', 'product.create'
    entityId: uuid('entity_id'), // Optional: ID of the entity affected (product_id, user_id, etc.)
    details: jsonb('details'), // Metadata: { ip, ua, diff, etc. }
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
}, table => ({
    userIdIdx: index('user_activity_logs_user_id_idx').on(table.userId),
    actionIdx: index('user_activity_logs_action_idx').on(table.action),
    createdAtIdx: index('user_activity_logs_created_at_idx').on(table.createdAt),
}));
//# sourceMappingURL=schema.js.map