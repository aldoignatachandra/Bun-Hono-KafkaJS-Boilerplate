import { pgEnum } from 'drizzle-orm/pg-core';

// User roles enum
export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);

// Export role type
export type Role = 'ADMIN' | 'USER';
