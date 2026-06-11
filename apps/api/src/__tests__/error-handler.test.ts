import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { errorHandler } from '../middleware/error-handler.js';

describe('errorHandler', () => {
  it('logs and returns 500 for unexpected errors', async () => {
    const app = express();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    app.get('/boom', () => {
      throw new Error('unexpected failure');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom').expect(500);

    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(errorSpy).toHaveBeenCalledWith('[api] Unhandled error:', expect.any(Error));

    errorSpy.mockRestore();
  });
});
