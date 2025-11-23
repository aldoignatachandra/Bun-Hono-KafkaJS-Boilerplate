import { configLoader } from '@common/config/loader';
import logger from '@common/logger';
import app from './src/app';

const port = configLoader.getConfig().services.userService.port;

Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`User service running on http://localhost:${port}`);
