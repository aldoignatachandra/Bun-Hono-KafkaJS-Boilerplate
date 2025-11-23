import { configLoader } from '@cqrs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema';

// Connection pool configuration
const connectionConfig = {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Idle timeout in seconds
  connect_timeout: 10, // Connect timeout in seconds
};

// Create postgres client
const connectionString = configLoader.getConfig().database.url;
const client = postgres(connectionString, connectionConfig);

// Create Drizzle instance
export const drizzleDb = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Export for direct access
export { client };

// Database connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
