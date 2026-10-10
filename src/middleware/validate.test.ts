import { describe, it } from 'node:test';
import { expect } from 'earl';
import { Request, Response } from 'express';
import { z } from 'zod';
import { validate } from './validate';

const schema = z.object({
  name: z.string({ error: 'FIELD_REQUIRED' }).trim(),
});

// Runs the middleware and records whatever it passes to next().
const run = (body: unknown) => {
  const req = { body } as Request;
  const nextArgs: unknown[][] = [];
  validate(schema)(req, {} as Response, (...args: unknown[]) => { nextArgs.push(args); });
  return { req, nextArgs };
};

describe('validate middleware', () => {
  it('continues with the parsed body when it is valid', () => {
    const { req, nextArgs } = run({ name: '  Ada ', extra: true });

    expect(req.body).toEqual({ name: 'Ada' });
    expect(nextArgs).toEqual([[]]);
  });

  it('passes a 400 error listing each failing field and code to next', () => {
    const { nextArgs } = run({});

    expect(nextArgs).toEqual([[
      expect.subset({
        status: 400,
        code: 'VALIDATION_ERROR',
        details: [{ field: 'name', code: 'FIELD_REQUIRED' }],
      }),
    ]]);
  });
});
