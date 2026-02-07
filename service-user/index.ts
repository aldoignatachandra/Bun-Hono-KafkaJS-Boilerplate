import app from './src/app';
import { configLoader } from './src/config/loader';
import { initializeKafkaTopics } from './src/helpers/kafka';
import logger from './src/helpers/logger';

const port = configLoader.getConfig().services.userService.port;

// Initialize Kafka topics (if configured)
// This ensures topics exist before we start consuming/producing
await initializeKafkaTopics();

Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`User service running on http://localhost:${port}`);
