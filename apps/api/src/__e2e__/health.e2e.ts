import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '@/lib/prisma.js';
import { resetDatabase } from '@/test/helpers.js';
import { baseUrl } from './server.js';

describe('e2e: health', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns minimal infra probe on GET /health', async () => {
    await prisma.word.create({
      data: { text: 'e2e-test', length: 8 },
    });

    const res = await request(baseUrl).get('/health').expect(200);

    expect(res.body).toEqual({
      status: 'ok',
      database: 'connected',
    });
    expect(res.body).not.toHaveProperty('wordCount');
  });

  it('returns full app health on GET /v1/health', async () => {
    await prisma.word.create({
      data: { text: 'e2e-test', length: 8 },
    });

    const res = await request(baseUrl).get('/v1/health').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      database: 'connected',
      wordCount: 1,
      apiVersion: 'v1',
    });
  });
});
