import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// Load environment variables
config({ path: '.env' });

export default {
  schema: './src/schema/index.ts',
  out: './src/migrations',
  driver: 'pg',
  dbCredentials: {
    url: process.env.DB_URL!,
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'timestamp',
  },
} satisfies Config;
