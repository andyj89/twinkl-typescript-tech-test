import { ErrorRequestHandler } from 'express';
import { DomainError, ERROR_CODE } from '../errors';

// body-parser raises a SyntaxError tagged with this type when the JSON body is malformed.
const isMalformedJson = (err: unknown) => (
  err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed'
);

// Without this, malformed JSON gets Express's default HTML error page.
const asDomainError = (err: unknown) => {
  if (err instanceof DomainError) return err;
  if (isMalformedJson(err)) {
    return DomainError.BadRequest({
      code: ERROR_CODE.INVALID_JSON,
      message: 'The request body is not valid JSON.',
    });
  }
  return undefined;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const domainError = asDomainError(err);

  if (!domainError) {
    // Infrastructure failure. Log the real cause, return nothing identifying to the client.
    console.error(err);
    res.status(500).json({
      error: {
        code: ERROR_CODE.INTERNAL_ERROR,
        message: 'Something went wrong.',
      },
    });
    return;
  }

  const { code, message, details, status } = domainError;
  res.status(status).json({
    error: { code, message, ...(details !== undefined && { details }) },
  });
};
