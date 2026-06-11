import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { errorHandler } from '../middleware/error-handler.js';
import { requestId } from '../middleware/request-id.js';

vi.mock('../lib/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { logger } from '../lib/logger.js';

describe('errorHandler', () => {
  it('logs and returns 500 for unexpected errors', async () => {
    const app = express();
    app.use(requestId);

    app.get('/boom', () => {
      throw new Error('unexpected failure');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom').expect(500);

    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error), requestId: expect.any(String) },
      'Unhandled API error',
    );
  });
});
