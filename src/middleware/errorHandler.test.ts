import { describe, it } from 'node:test';
import { expect } from 'earl';
import { Request, Response } from 'express';
import { DomainError } from '../errors';
import { errorHandler } from './errorHandler';

// Runs the handler with a recording Response double.
const handle = (err: unknown) => {
  const res = { statusCode: 0, body: undefined as unknown } as {
    statusCode: number; body: unknown; status: (c: number) => unknown; json: (b: unknown) => unknown;
  };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (b) => { res.body = b; return res; };
  errorHandler(err, {} as Request, res as unknown as Response, () => {});
  return res;
};

describe('errorHandler', () => {
  const details = [{ field: 'password', code: 'PASSWORD_MISSING_DIGIT' }];

  [
    {
      name: 'a DomainError with its status, code and message',
      err: new DomainError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists.', 409),
      status: 409,
      body: { error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' } },
    },
    {
      name: 'a bad request with its details',
      err: DomainError.BadRequest({ details }),
      status: 400,
      body: { error: { code: 'VALIDATION_ERROR', message: 'The request contains invalid fields.', details } },
    },
    {
      name: 'malformed JSON from the body parser as a 400',
      err: Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed' }),
      status: 400,
      body: { error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } },
    },
  ].forEach(({
    name, err, status, body,
  }) => {
    it(`renders ${name}`, () => {
      const res = handle(err);

      expect(res.statusCode).toEqual(status);
      expect(res.body).toEqual(body);
    });
  });

  it('returns a generic 500 that does not leak the underlying error', (t) => {
    t.mock.method(console, 'error', () => {});

    const res = handle(new Error('SQLITE_ERROR: no such table: users'));

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
  });
});
