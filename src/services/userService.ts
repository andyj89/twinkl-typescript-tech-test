import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { DomainError, ERROR_CODE } from '../errors';
import {
  IUserRepository,
  StoredUser,
  User,
} from '../repositories/userRepository';
import { SignupInput } from '../schemas/user';

export interface IUserService {
  createUser(input: SignupInput): Promise<User>;
  getUser(id: string): Promise<User>;
}

export const createUserService = (users: IUserRepository): IUserService => {
  // What leaves the service. The password hash never does.
  const toUser = ({
    id,
    fullName,
    email,
    userType,
    createdDate,
  }: StoredUser): User => ({
    id,
    fullName,
    email,
    userType,
    createdDate,
  });

  return {
    async createUser(input) {
      const { password, ...fields } = input;
      const passwordHash = await argon2.hash(password);
      const storedUser = users.create({
        id: randomUUID(),
        passwordHash,
        ...fields,
      });
      return toUser(storedUser);
    },

    async getUser(id) {
      const storedUser = users.findById(id);
      if (!storedUser)
        throw DomainError.NotFound(
          ERROR_CODE.USER_NOT_FOUND,
          'User not found.',
        );
      return toUser(storedUser);
    },
  };
};
