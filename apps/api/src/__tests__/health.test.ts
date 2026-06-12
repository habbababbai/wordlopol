import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { apiPath, createTestAgent, resetDatabase } from '@/test/helpers.js';

const appOkBody = {
  status: 'ok',
  database: 'connected',
  apiVersion: 'v1',
} as const;

const infraOkBody = {
  status: 'ok',
  database: 'connected',
} as const;

const appDegradedBody = {
  status: 'degraded',
  database: 'disconnected',
  apiVersion: 'v1',
} as const;

const infraDegradedBody = {
  status: 'degraded',
  database: 'disconnected',
} as const;

describe('GET /health', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns minimal infra probe on unversioned path', async () => {
    await prisma.word.createMany({
      data: [
        { text: 'jabłko', length: 5 },
        { text: 'wąż', length: 3 },
      ],
    });

    const agent = await createTestAgent();
    const res = await agent.get('/health').expect(200);

    expect(res.body).toEqual(infraOkBody);
    expect(res.body).not.toHaveProperty('wordCount');
    expect(res.body).not.toHaveProperty('apiVersion');
  });

  it('returns full app health on /v1/health', async () => {
    await prisma.word.createMany({
      data: [
        { text: 'jabłko', length: 5 },
        { text: 'wąż', length: 3 },
      ],
    });

    const agent = await createTestAgent();
    const res = await agent.get(apiPath('/health')).expect(200);

    expect(res.body).toEqual({
      ...appOkBody,
      wordCount: 2,
    });
  });

  it('returns wordCount 0 on /v1/health when dictionary is empty', async () => {
    const agent = await createTestAgent();
    const res = await agent.get(apiPath('/health')).expect(200);

    expect(res.body).toMatchObject({
      ...appOkBody,
      wordCount: 0,
    });
  });

  it('returns 503 on infra probe when database is unavailable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('connection refused'));

    const agent = await createTestAgent();
    const res = await agent.get('/health').expect(503);

    expect(res.body).toEqual(infraDegradedBody);
  });

  it('returns 503 on app health when database is unavailable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('connection refused'));

    const agent = await createTestAgent();
    const res = await agent.get(apiPath('/health')).expect(503);

    expect(res.body).toEqual(appDegradedBody);
  });
});
