import type { Request, Response } from 'express';
import {
  API_VERSION,
  type HealthDegradedResponseDto,
  type HealthOkResponseDto,
  type InfraHealthDegradedResponseDto,
  type InfraHealthOkResponseDto,
} from '@wordlopol/shared';

import { prisma } from './prisma.js';

async function checkDatabase(): Promise<boolean> {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}

export async function infraHealthHandler(_req: Request, res: Response): Promise<void> {
  try {
    await checkDatabase();
    const body: InfraHealthOkResponseDto = {
      status: 'ok',
      database: 'connected',
    };
    res.json(body);
  } catch {
    const body: InfraHealthDegradedResponseDto = {
      status: 'degraded',
      database: 'disconnected',
    };
    res.status(503).json(body);
  }
}

export async function appHealthHandler(_req: Request, res: Response): Promise<void> {
  try {
    await checkDatabase();
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
