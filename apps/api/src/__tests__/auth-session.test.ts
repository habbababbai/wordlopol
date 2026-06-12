import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { signAccessToken } from '@/lib/tokens.js';
import { expectApiError } from './helpers/expect-api-error.js';
import {
  apiPath,
  createTestAgent,
  createVerifiedUserWithPassword,
  resetDatabase,
} from '@/test/helpers.js';

describe('auth session endpoints', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('refreshes access token using refresh cookie', async () => {
    const { user, password } = await createVerifiedUserWithPassword();
    const agent = await createTestAgent();

    await agent.post(apiPath('/auth/login')).send({
      email: user.email,
      password,
    });

    const refreshRes = await agent.post(apiPath('/auth/refresh')).expect(200);

    expect(refreshRes.body.accessToken).toEqual(expect.any(String));
    expect(refreshRes.body.refreshToken).toBeUndefined();
    expect(refreshRes.headers['set-cookie']?.[0]).toContain('refresh_token=');
  });

  it('rejects refresh after logout', async () => {
    const { user, password } = await createVerifiedUserWithPassword();
    const agent = await createTestAgent();

    await agent.post(apiPath('/auth/login')).send({
      email: user.email,
      password,
    });

    await agent.post(apiPath('/auth/logout')).expect(200).expect({ message: 'Logged out' });

    const refreshRes = await agent.post(apiPath('/auth/refresh'));
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body).toEqual(expectApiError('MISSING_REFRESH_TOKEN'));
  });

  it('logout-all revokes every refresh session for the user', async () => {
    const { user, password } = await createVerifiedUserWithPassword();
    const deviceA = await createTestAgent();
    const deviceB = await createTestAgent();

    await deviceA.post(apiPath('/auth/login')).send({ email: user.email, password });
    await deviceB.post(apiPath('/auth/login')).send({ email: user.email, password });

    const accessToken = signAccessToken(user.id);

    await deviceA
      .post(apiPath('/auth/logout-all'))
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ message: 'Logged out from all devices' });

    expect((await deviceA.post(apiPath('/auth/refresh'))).status).toBe(401);
    expect((await deviceB.post(apiPath('/auth/refresh'))).status).toBe(401);
  });
});
