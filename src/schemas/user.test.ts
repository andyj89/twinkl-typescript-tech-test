import { describe, it } from 'node:test';
import { expect } from 'earl';
import { SignupInput, signupSchema } from './user';

const validSignup: SignupInput = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Passw0rdOk',
  createdDate: '2024-05-01T10:00:00Z',
  userType: 'teacher',
};

// Returns [field, code] pairs, which is what the client receives.
const failures = (input: unknown) => {
  const result = signupSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((i) => [i.path.join('.') || 'body', i.message]);
};

describe('signupSchema', () => {
  it('accepts valid input', () => {
    expect(failures(validSignup)).toEqual([]);
  });

  it('trims the name and lowercases the email', () => {
    const result = signupSchema.parse({
      ...validSignup,
      fullName: '  Ada Lovelace ',
      email: ' Ada@Example.COM ',
    });

    expect(result).toEqual({ ...validSignup, fullName: 'Ada Lovelace', email: 'ada@example.com' });
  });

  ['student', 'teacher', 'parent', 'private_tutor'].forEach((userType) => {
    it(`accepts the ${userType} user type`, () => {
      expect(failures({ ...validSignup, userType })).toEqual([]);
    });
  });

  [
    {
      name: 'an empty body, reporting every field',
      input: {},
      expected: [
        ['fullName', 'FIELD_REQUIRED'],
        ['email', 'FIELD_REQUIRED'],
        ['password', 'FIELD_REQUIRED'],
        ['createdDate', 'INVALID_DATE'],
        ['userType', 'INVALID_USER_TYPE'],
      ],
    },
    {
      name: 'a body that is not an object',
      input: 'nope',
      expected: [['body', 'INVALID_BODY']],
    },
    {
      name: 'a whitespace-only name',
      input: { ...validSignup, fullName: '   ' },
      expected: [['fullName', 'FIELD_REQUIRED']],
    },
    {
      name: 'an empty email',
      input: { ...validSignup, email: '' },
      expected: [['email', 'FIELD_REQUIRED']],
    },
    {
      name: 'an invalid email',
      input: { ...validSignup, email: 'not-an-email' },
      expected: [['email', 'INVALID_EMAIL']],
    },
    {
      name: 'an unknown user type',
      input: { ...validSignup, userType: 'admin' },
      expected: [['userType', 'INVALID_USER_TYPE']],
    },
    {
      name: 'an invalid created date',
      input: { ...validSignup, createdDate: 'yesterday' },
      expected: [['createdDate', 'INVALID_DATE']],
    },
  ].forEach(({ name, input, expected }) => {
    it(`rejects ${name}`, () => {
      expect(failures(input)).toEqual(expected);
    });
  });

  describe('password rules', () => {
    [
      { name: 'the shortest valid password, 8 characters', password: 'Abcdefg1', expected: [] },
      { name: 'the longest valid password, 64 characters', password: `Ab1${'x'.repeat(61)}`, expected: [] },
      {
        name: 'a password under 8 characters',
        password: 'Ab1',
        expected: [['password', 'PASSWORD_TOO_SHORT']],
      },
      {
        name: 'a password over 64 characters',
        password: `Ab1${'x'.repeat(62)}`,
        expected: [['password', 'PASSWORD_TOO_LONG']],
      },
      {
        name: 'a password with no digit',
        password: 'Abcdefghij',
        expected: [['password', 'PASSWORD_MISSING_DIGIT']],
      },
      {
        name: 'a password with no lowercase letter',
        password: 'ABCDEFGH1',
        expected: [['password', 'PASSWORD_MISSING_LOWERCASE']],
      },
      {
        name: 'a password with no uppercase letter',
        password: 'abcdefgh1',
        expected: [['password', 'PASSWORD_MISSING_UPPERCASE']],
      },
      {
        name: 'a password failing several rules, reporting all of them',
        password: 'abc',
        expected: [
          ['password', 'PASSWORD_TOO_SHORT'],
          ['password', 'PASSWORD_MISSING_DIGIT'],
          ['password', 'PASSWORD_MISSING_UPPERCASE'],
        ],
      },
    ].forEach(({ name, password, expected }) => {
      it(`handles ${name}`, () => {
        expect(failures({ ...validSignup, password })).toEqual(expected);
      });
    });
  });
});
