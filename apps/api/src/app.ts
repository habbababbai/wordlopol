import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { HealthDegradedResponseDto, HealthOkResponseDto } from '@wordlopol/shared';

import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { dailyRouter } from './routes/daily.js';
import { infiniteRouter } from './routes/infinite.js';
import { userRouter } from './routes/user.js';

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
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', authRouter);
  app.use('/daily', dailyRouter);
  app.use('/infinite', infiniteRouter);
  app.use('/user', userRouter);

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const wordCount = await prisma.word.count();
      const body: HealthOkResponseDto = {
        status: 'ok',
        database: 'connected',
        wordCount,
      };
      res.json(body);
    } catch {
      const body: HealthDegradedResponseDto = { status: 'degraded', database: 'disconnected' };
      res.status(503).json(body);
    }
  });

  app.use(errorHandler);

  return app;
}
