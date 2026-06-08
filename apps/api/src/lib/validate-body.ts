import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';

export function validateBody<T extends z.ZodType>(schema: T): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}
