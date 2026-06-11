import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_MAX_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function readRequestIdHeader(req: Request): string | undefined {
  const header = req.headers['x-request-id'];
  const raw = Array.isArray(header) ? header[0] : header;

  if (
    typeof raw === 'string' &&
    raw.length > 0 &&
    raw.length <= REQUEST_ID_MAX_LENGTH &&
    REQUEST_ID_PATTERN.test(raw)
  ) {
    return raw;
  }

  return undefined;
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = readRequestIdHeader(req) ?? randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
