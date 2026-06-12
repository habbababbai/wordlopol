import { createApp } from '@/app.js';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';
import { prisma } from '@/lib/prisma.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API listening');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down');

  const timeout = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  timeout.unref();

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error closing HTTP server');
      clearTimeout(timeout);
      process.exit(1);
      return;
    }

    prisma
      .$disconnect()
      .then(() => {
        clearTimeout(timeout);
        logger.info('Graceful shutdown complete');
        process.exit(0);
      })
      .catch((disconnectErr) => {
        logger.error({ err: disconnectErr }, 'Error disconnecting Prisma');
        clearTimeout(timeout);
        process.exit(1);
      });
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
