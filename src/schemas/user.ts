import { z } from 'zod';
import { ERROR_CODE } from '../errors';

export const USER_TYPES = ['student', 'teacher', 'parent', 'private_tutor'] as const;

const required = { error: ERROR_CODE.FIELD_REQUIRED };

// Each rule's zod message is the error code returned to the client. All failing
// password rules are reported together so the client can show every problem at once.
export const signupSchema = z.object({
  fullName: z.string(required).trim().min(1, required),
  email: z
    .string(required)
    .trim()
    .toLowerCase()
    .min(1, required)
    .pipe(z.email({ error: ERROR_CODE.INVALID_EMAIL })),
  password: z
    .string(required)
    .min(8, { error: ERROR_CODE.PASSWORD_TOO_SHORT })
    .max(64, { error: ERROR_CODE.PASSWORD_TOO_LONG })
    .regex(/\d/, { error: ERROR_CODE.PASSWORD_MISSING_DIGIT })
    .regex(/[a-z]/, { error: ERROR_CODE.PASSWORD_MISSING_LOWERCASE })
    .regex(/[A-Z]/, { error: ERROR_CODE.PASSWORD_MISSING_UPPERCASE }),
  createdDate: z.iso.datetime({ offset: true, error: ERROR_CODE.INVALID_DATE }),
  userType: z.enum(USER_TYPES, { error: ERROR_CODE.INVALID_USER_TYPE }),
}, { error: ERROR_CODE.INVALID_BODY });

export type SignupInput = z.infer<typeof signupSchema>;
