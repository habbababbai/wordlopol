import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { authRouter } from './routes/auth.js';

export function createApp(): Express {
  const app = express();

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

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const wordCount = await prisma.word.count();
      res.json({ status: 'ok', database: 'connected', wordCount });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'disconnected' });
    }
  });

  return app;
}
