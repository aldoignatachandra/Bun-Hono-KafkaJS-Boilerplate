import 'reflect-metadata';
import app from './src/app';
import { configLoader } from './src/config/loader';
import './src/helpers/bun-patches'; // Suppress KafkaJS/Bun warnings
import { initializeKafkaTopics } from './src/helpers/kafka';
import logger from './src/helpers/logger';

const port = configLoader.getConfig().services.productService.port;

let server: ReturnType<typeof Bun.serve> | null = null;
let isShuttingDown = false;

// Initialize Kafka topics (if configured)
// This ensures topics exist before we start consuming/producing
await initializeKafkaTopics();

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.info(`Already shutting down, ignoring ${signal}`);
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}, starting graceful shutdown...`);

  if (server) {
    server.stop();
    logger.info('HTTP server stopped');
  }

  const SHUTDOWN_TIMEOUT = 30000;
  const startTime = Date.now();
  while (Date.now() - startTime < SHUTDOWN_TIMEOUT) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  try {
    const { closeDatabaseConnection } = await import('./src/db/connection');
    await closeDatabaseConnection();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error({ err }, 'Error closing database connection');
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server = Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`Product service running on http://localhost:${port}`);
