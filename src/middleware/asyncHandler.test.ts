import { describe, it, mock } from 'node:test';
import { expect } from 'earl';
import { Request, Response } from 'express';
import { asyncHandler } from './asyncHandler';

describe('asyncHandler', () => {
  it('forwards a rejected promise to next', async () => {
    const error = new Error('boom');

    const forwarded = await new Promise((resolve) => {
      asyncHandler(() => Promise.reject(error))({} as Request, {} as Response, resolve);
    });

    expect(forwarded).toEqual(error);
  });

  it('does not call next when the handler succeeds', async () => {
    const next = mock.fn();
    const handled = Promise.resolve();

    asyncHandler(() => handled)({} as Request, {} as Response, next);
    await handled;

    expect(next.mock.callCount()).toEqual(0);
  });
});
