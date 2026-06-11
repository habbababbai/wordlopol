import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { apiPath, createTestAgent, resetDatabase } from '../test/helpers.js';

const okBody = {
  status: 'ok',
  database: 'connected',
  apiVersion: 'v1',
} as const;

const degradedBody = {
  status: 'degraded',
  database: 'disconnected',
  apiVersion: 'v1',
} as const;

describe('GET /health', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with connected database and word count on unversioned path', async () => {
    await prisma.word.createMany({
      data: [
        { text: 'jabłko', length: 5 },
        { text: 'wąż', length: 3 },
      ],
    });

    const agent = await createTestAgent();
    const res = await agent.get('/health').expect(200);

    expect(res.body).toEqual({
      ...okBody,
      wordCount: 2,
    });
  });

  it('returns 200 with connected database and word count on /v1/health', async () => {
    await prisma.word.createMany({
      data: [
        { text: 'jabłko', length: 5 },
        { text: 'wąż', length: 3 },
      ],
    });

    const agent = await createTestAgent();
    const res = await agent.get(apiPath('/health')).expect(200);

    expect(res.body).toEqual({
      ...okBody,
      wordCount: 2,
    });
  });

  it('returns wordCount 0 when dictionary is empty', async () => {
    const agent = await createTestAgent();
    const res = await agent.get('/health').expect(200);

    expect(res.body).toMatchObject({
      ...okBody,
      wordCount: 0,
    });
  });

  it('returns 503 when database is unavailable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('connection refused'));

    const agent = await createTestAgent();
    const res = await agent.get('/health').expect(503);

    expect(res.body).toEqual(degradedBody);
  });
});
