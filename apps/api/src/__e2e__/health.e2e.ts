import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../lib/prisma.js';
import { resetDatabase } from '../test/helpers.js';
import { baseUrl } from './server.js';

describe('e2e: GET /health', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns health status over real http', async () => {
    await prisma.word.create({
      data: { text: 'e2e-test', length: 8 },
    });

    const res = await request(baseUrl).get('/health').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      database: 'connected',
      wordCount: 1,
    });
  });
});
