import { beforeEach, describe, it } from 'node:test';
import { expect } from 'earl';
import { DomainError } from '../errors';
import { createUserRepository, IUserRepository, StoredUser } from './userRepository';

const ada: StoredUser = {
  id: '11111111-1111-4111-8111-111111111111',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  passwordHash: '$argon2id$stored-hash',
  userType: 'teacher',
  createdDate: '2024-05-01T10:00:00Z',
};

describe('userRepository', () => {
  let users: IUserRepository;

  beforeEach(() => {
    users = createUserRepository(':memory:');
  });

  it('returns the user it saved', () => {
    expect(users.create(ada)).toEqual(ada);
  });

  it('finds a saved user by id', () => {
    users.create(ada);

    expect(users.findById(ada.id)).toEqual(ada);
  });

  it('finds nothing for an unknown id', () => {
    expect(users.findById('nope')).toEqual(undefined);
  });

  it('rejects a duplicate email, ignoring case', () => {
    users.create(ada);
    const duplicate = { ...ada, id: '22222222-2222-4222-8222-222222222222', email: 'ADA@example.com' };

    expect(() => users.create(duplicate)).toThrow(DomainError, 'An account with this email already exists.');
  });
});
