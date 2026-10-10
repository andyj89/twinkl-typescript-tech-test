import { beforeEach, describe, it } from 'node:test';
import { expect } from 'earl';
import * as argon2 from 'argon2';
import { createUserRepository, IUserRepository } from '../repositories/userRepository';
import { SignupInput } from '../schemas/user';
import { createUserService, IUserService } from './userService';

const signup: SignupInput = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Passw0rdOk',
  createdDate: '2024-05-01T10:00:00Z',
  userType: 'teacher',
};

// Resolves to whatever the promise rejected with, or undefined if it did not reject.
const rejection = (promise: Promise<unknown>) => promise.then(() => undefined, (err: unknown) => err);

describe('userService', () => {
  let repository: IUserRepository;
  let users: IUserService;

  beforeEach(() => {
    repository = createUserRepository(':memory:');
    users = createUserService(repository);
  });

  describe('createUser', () => {
    it('returns the saved user with an id and without the password', async () => {
      const user = await users.createUser(signup);

      expect(user).toEqual({
        id: expect.a(String),
        fullName: signup.fullName,
        email: signup.email,
        userType: signup.userType,
        createdDate: signup.createdDate,
      });
    });

    [
      { email: 'ada@example.com', password: 'Passw0rdOk' },
      { email: 'grace@example.com', password: 'An0therPassw0rd' },
    ].forEach(({ email, password }) => {
      it(`stores a hash of the password, not the password, for ${email}`, async () => {
        const created = await users.createUser({ ...signup, email, password });

        const passwordHash = repository.findById(created.id)?.passwordHash ?? '';
        expect(passwordHash).not.toEqual(password);
        expect(await argon2.verify(passwordHash, password)).toEqual(true);
      });
    });

    it('gives users with the same password different hashes', async () => {
      const ada = await users.createUser(signup);
      const grace = await users.createUser({ ...signup, email: 'grace@example.com' });

      const adaHash = repository.findById(ada.id)?.passwordHash;
      const graceHash = repository.findById(grace.id)?.passwordHash;
      expect(adaHash).not.toEqual(graceHash);
    });

    it('rejects a duplicate email, ignoring case, with a 409', async () => {
      await users.createUser(signup);

      const error = await rejection(users.createUser({ ...signup, email: 'ADA@example.com' }));

      expect(error).toEqual(expect.subset({ status: 409, code: 'EMAIL_ALREADY_EXISTS' }));
    });
  });

  describe('getUser', () => {
    it('returns a saved user by id', async () => {
      const created = await users.createUser(signup);

      expect(await users.getUser(created.id)).toEqual(created);
    });

    it('rejects an unknown id with a 404', async () => {
      const error = await rejection(users.getUser('does-not-exist'));

      expect(error).toEqual(expect.subset({ status: 404, code: 'USER_NOT_FOUND' }));
    });
  });
});
