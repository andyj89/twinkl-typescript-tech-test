// Machine-readable codes returned to the client. Clients branch on these, never on messages.
export const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_BODY: 'INVALID_BODY',
  INVALID_JSON: 'INVALID_JSON',
  FIELD_REQUIRED: 'FIELD_REQUIRED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_USER_TYPE: 'INVALID_USER_TYPE',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',
  PASSWORD_MISSING_DIGIT: 'PASSWORD_MISSING_DIGIT',
  PASSWORD_MISSING_LOWERCASE: 'PASSWORD_MISSING_LOWERCASE',
  PASSWORD_MISSING_UPPERCASE: 'PASSWORD_MISSING_UPPERCASE',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }

  static BadRequest({
    code = ERROR_CODE.VALIDATION_ERROR,
    message = 'The request contains invalid fields.',
    details,
  }: { code?: ErrorCode; message?: string; details?: unknown } = {}) {
    return new DomainError(code, message, 400, details);
  }

  static NotFound(code: ErrorCode, message: string) {
    return new DomainError(code, message, 404);
  }

  static Conflict(code: ErrorCode, message: string) {
    return new DomainError(code, message, 409);
  }
}
