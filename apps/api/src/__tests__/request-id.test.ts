import express from 'express';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { requestId } from '../middleware/request-id.js';

describe('requestId middleware', () => {
  it('sets x-request-id on the response', async () => {
    const app = express();
    app.use(requestId);
    app.get('/ping', (req, res) => {
      res.json({ requestId: req.requestId });
    });

    const res = await request(app).get('/ping').expect(200);

    expect(res.headers['x-request-id']).toEqual(expect.any(String));
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('preserves incoming x-request-id', async () => {
    const app = express();
    app.use(requestId);
    app.get('/ping', (req, res) => {
      res.json({ requestId: req.requestId });
    });

    const res = await request(app).get('/ping').set('x-request-id', 'client-id').expect(200);

    expect(res.headers['x-request-id']).toBe('client-id');
    expect(res.body.requestId).toBe('client-id');
  });
});
