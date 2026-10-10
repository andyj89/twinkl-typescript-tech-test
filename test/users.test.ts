import { after, before, describe, it } from 'node:test';
import { once } from 'node:events';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { expect } from 'earl';

const validSignup = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Passw0rdOk',
  createdDate: '2024-05-01T10:00:00Z',
  userType: 'private_tutor',
};

describe('users API', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    // Must be set before the app loads, so it gets a throwaway database.
    process.env.DB_PATH = ':memory:';
    const { app } = await import('../src/app');

    server = app.listen(0);
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => {
    server.closeAllConnections();
    server.close();
  });

  const request = async (method: string, path: string, body?: string) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return { status: response.status, body: await response.json() as unknown };
  };

  const signup = (user: unknown) => request('POST', '/users', JSON.stringify(user));

  describe('signing up and fetching the user', () => {
    it('creates the user, then returns the same user by id', async () => {
      const email = 'happy@example.com';
      const expectedUser = {
        fullName: validSignup.fullName,
        email,
        userType: validSignup.userType,
        createdDate: validSignup.createdDate,
      };

      const created = await signup({ ...validSignup, email });
      expect(created).toEqual({ status: 201, body: { id: expect.a(String), ...expectedUser } });

      const { id } = created.body as { id: string };
      const fetched = await request('GET', `/users/${id}`);
      expect(fetched).toEqual({ status: 200, body: { id, ...expectedUser } });
    });

    it('stores the email lowercased and the name trimmed', async () => {
      const created = await signup({
        ...validSignup,
        fullName: '  Grace Hopper ',
        email: ' Grace@Example.COM ',
      });

      expect(created).toEqual({
        status: 201,
        body: expect.subset({ fullName: 'Grace Hopper', email: 'grace@example.com' }),
      });
    });
  });

  describe('rejecting a signup', () => {
    [
      {
        name: 'a password failing several rules',
        user: { ...validSignup, email: 'weak@example.com', password: 'abc' },
        details: [
          { field: 'password', code: 'PASSWORD_TOO_SHORT' },
          { field: 'password', code: 'PASSWORD_MISSING_DIGIT' },
          { field: 'password', code: 'PASSWORD_MISSING_UPPERCASE' },
        ],
      },
      {
        name: 'an empty body',
        user: {},
        details: [
          { field: 'fullName', code: 'FIELD_REQUIRED' },
          { field: 'email', code: 'FIELD_REQUIRED' },
          { field: 'password', code: 'FIELD_REQUIRED' },
          { field: 'createdDate', code: 'INVALID_DATE' },
          { field: 'userType', code: 'INVALID_USER_TYPE' },
        ],
      },
      {
        name: 'an invalid email and user type',
        user: { ...validSignup, email: 'not-an-email', userType: 'admin' },
        details: [
          { field: 'email', code: 'INVALID_EMAIL' },
          { field: 'userType', code: 'INVALID_USER_TYPE' },
        ],
      },
    ].forEach(({ name, user, details }) => {
      it(`returns a 400 listing each problem for ${name}`, async () => {
        const response = await signup(user);

        expect(response).toEqual({
          status: 400,
          body: {
            error: { code: 'VALIDATION_ERROR', message: 'The request contains invalid fields.', details },
          },
        });
      });
    });

    it('returns a 400 INVALID_JSON for a malformed body', async () => {
      const response = await request('POST', '/users', '{oops');

      expect(response).toEqual({
        status: 400,
        body: { error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } },
      });
    });

    it('returns a 409 EMAIL_ALREADY_EXISTS for an email that is already registered, ignoring case', async () => {
      await signup({ ...validSignup, email: 'taken@example.com' });

      const response = await signup({ ...validSignup, email: 'TAKEN@example.com' });

      expect(response).toEqual({
        status: 409,
        body: { error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' } },
      });
    });
  });

  describe('fetching a user', () => {
    it('returns a 404 USER_NOT_FOUND for an unknown id', async () => {
      const response = await request('GET', '/users/does-not-exist');

      expect(response).toEqual({
        status: 404,
        body: { error: { code: 'USER_NOT_FOUND', message: 'User not found.' } },
      });
    });
  });
});
