// Core exports
export * from './core';

// Entity exports
export * from './entities/products';
export * from './entities/users';

// Relations exports
export * from './relations';

// Schema configuration
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './entities';

// Database connection setup
export function createDrizzleSchema(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
}

// Export all tables for migration generation
export { products, users } from './entities';
