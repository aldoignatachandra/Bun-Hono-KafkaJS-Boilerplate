import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'reflect-metadata';
import { configLoader } from './config/loader';

// Connection pool configuration
const connectionConfig = {
  max: configLoader.getConfig().database.pool.max,
  idle_timeout: Math.floor(configLoader.getConfig().database.pool.idleTimeoutMs / 1000), // Convert to seconds
  connect_timeout: 10, // Connect timeout in seconds
};

// Create postgres client
const connectionString = configLoader.getConfig().database.url;
const client = postgres(connectionString, connectionConfig);

// Create Drizzle instance
const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development',
});

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    await client.end();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
});

export default db;
export { client };
