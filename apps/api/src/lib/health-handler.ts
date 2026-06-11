import type { Request, Response } from 'express';
import {
  API_VERSION,
  type HealthDegradedResponseDto,
  type HealthOkResponseDto,
} from '@wordlopol/shared';

import { prisma } from './prisma.js';

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const wordCount = await prisma.word.count();
    const body: HealthOkResponseDto = {
      status: 'ok',
      database: 'connected',
      wordCount,
      apiVersion: API_VERSION,
    };
    res.json(body);
  } catch {
    const body: HealthDegradedResponseDto = {
      status: 'degraded',
      database: 'disconnected',
      apiVersion: API_VERSION,
    };
    res.status(503).json(body);
  }
}
