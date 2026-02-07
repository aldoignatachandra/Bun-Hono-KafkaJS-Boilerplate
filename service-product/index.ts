import { configLoader } from './src/config/loader';
import { initializeKafkaTopics } from './src/helpers/kafka';
import logger from './src/helpers/logger';
import app from './src/app';

const port = configLoader.getConfig().services.productService.port;

// Initialize Kafka topics (if configured)
// This ensures topics exist before we start consuming/producing
await initializeKafkaTopics();

Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`Product service running on http://localhost:${port}`);
