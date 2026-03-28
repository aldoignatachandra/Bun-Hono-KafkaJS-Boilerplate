import 'reflect-metadata';
import { Container } from 'typedi';
import app from './src/app';
import { configLoader } from './src/config/loader';
import './src/helpers/bun-patches'; // Suppress KafkaJS/Bun warnings
import { initializeKafkaTopics } from './src/helpers/kafka';
import logger from './src/helpers/logger';
import { ActivityLogConsumer } from './src/modules/user/consumers/ActivityLogConsumer';

const port = configLoader.getConfig().services.userService.port;

let server: ReturnType<typeof Bun.serve> | null = null;
let isShuttingDown = false;
let activityLogConsumer: ActivityLogConsumer | null = null;

// Initialize Kafka topics (if configured)
// This ensures topics exist before we start consuming/producing
await initializeKafkaTopics();

// Start Activity Log Consumer
const startConsumer = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      activityLogConsumer = Container.get(ActivityLogConsumer);
      await activityLogConsumer.start();
      return;
    } catch (error) {
      logger.error(`Failed to start Activity Log Consumer (attempt ${i + 1}/${retries}):`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('Failed to start Activity Log Consumer after multiple attempts');
};

startConsumer();

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

  if (activityLogConsumer) {
    try {
      await activityLogConsumer.stop();
      logger.info('Kafka consumer stopped');
    } catch (err) {
      logger.error({ err }, 'Error stopping Kafka consumer');
    }
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

logger.info(`User service running on http://localhost:${port}`);
