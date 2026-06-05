import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { signAccessToken } from '../lib/tokens.js';
import { createTestAgent, createVerifiedUserWithPassword, resetDatabase } from '../test/helpers.js';

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

    await agent.post('/auth/login').send({
      email: user.email,
      password,
    });

    const refreshRes = await agent.post('/auth/refresh').expect(200);

    expect(refreshRes.body.accessToken).toEqual(expect.any(String));
    expect(refreshRes.headers['set-cookie']?.[0]).toContain('refresh_token=');
  });

  it('rejects refresh after logout', async () => {
    const { user, password } = await createVerifiedUserWithPassword();
    const agent = await createTestAgent();

    await agent.post('/auth/login').send({
      email: user.email,
      password,
    });

    await agent.post('/auth/logout').expect(200).expect({ message: 'Logged out' });

    const refreshRes = await agent.post('/auth/refresh');
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body).toEqual({ error: 'Missing refresh token' });
  });

  it('logout-all revokes every refresh session for the user', async () => {
    const { user, password } = await createVerifiedUserWithPassword();
    const deviceA = await createTestAgent();
    const deviceB = await createTestAgent();

    await deviceA.post('/auth/login').send({ email: user.email, password });
    await deviceB.post('/auth/login').send({ email: user.email, password });

    const accessToken = signAccessToken(user.id);

    await deviceA
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ message: 'Logged out from all devices' });

    expect((await deviceA.post('/auth/refresh')).status).toBe(401);
    expect((await deviceB.post('/auth/refresh')).status).toBe(401);
  });
});
