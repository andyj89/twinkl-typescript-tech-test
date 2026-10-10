import { RequestHandler } from 'express';
import { z } from 'zod';
import { DomainError } from '../errors';


export const validate = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    next(DomainError.BadRequest({
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        code: issue.message,
      })),
    }));
    return;
  }
  req.body = result.data;
  next();
};
