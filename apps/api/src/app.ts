import { API_PATH_PREFIX } from '@wordlopol/shared';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { healthHandler } from './lib/health-handler.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { v1Router } from './routes/v1/index.js';

export function createApp(): Express {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(API_PATH_PREFIX, v1Router);
  app.get('/health', healthHandler);
  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}
