import { describe, expect, it } from 'vitest';
import { expectApiError } from './helpers/expect-api-error.js';
import { apiPath, createTestAgent } from '@/test/helpers.js';

describe('unknown routes', () => {
  it('returns JSON 404 for unknown versioned paths', async () => {
    const agent = await createTestAgent();

    const res = await agent.get(apiPath('/does-not-exist')).expect(404);

    expect(res.body).toEqual(expectApiError('NOT_FOUND'));
  });

  it('returns JSON 404 for unknown unversioned paths', async () => {
    const agent = await createTestAgent();

    const res = await agent.get('/unknown-route').expect(404);

    expect(res.body).toEqual(expectApiError('NOT_FOUND'));
  });
});
