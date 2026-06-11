import type { Request, Response } from 'express';

import { sendApiError } from '../lib/send-api-error.js';

export function notFoundHandler(_req: Request, res: Response): void {
  sendApiError(res, 404, 'NOT_FOUND');
}
