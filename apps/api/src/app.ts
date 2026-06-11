import { API_PATH_PREFIX } from '@wordlopol/shared';
import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { infraHealthHandler } from './lib/health-handler.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestId } from './middleware/request-id.js';
import { v1Router } from './routes/v1/index.js';

export function createApp(): Express {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(requestId);
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(API_PATH_PREFIX, v1Router);
  app.get('/health', infraHealthHandler);
  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}
