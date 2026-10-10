import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DomainError, ERROR_CODE } from '../errors';

export interface User {
  id: string;
  fullName: string;
  email: string;
  userType: string;
  createdDate: string;
}

// A user as stored, including the password hash. Only the repository and service see this.
export interface StoredUser extends User {
  passwordHash: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  user_type: string;
  created_date: string;
}

export interface IUserRepository {
  create(user: StoredUser): StoredUser;
  findById(id: string): StoredUser | undefined;
}

// Opens (and creates, if needed) the SQLite database. Pass ':memory:' for a throwaway one in tests.
export const createUserRepository = (path = process.env.DB_PATH ?? 'data/twinkl.db'): IUserRepository => {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      full_name     TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      user_type     TEXT NOT NULL,
      created_date  TEXT NOT NULL
    )
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, user_type, created_date)
    VALUES (@id, @fullName, @email, @passwordHash, @userType, @createdDate)
    RETURNING *
  `);
  const selectById = db.prepare('SELECT * FROM users WHERE id = ?');

  const toStoredUser = (userRow: UserRow): StoredUser => ({
    id: userRow.id,
    fullName: userRow.full_name,
    email: userRow.email,
    passwordHash: userRow.password_hash,
    userType: userRow.user_type,
    createdDate: userRow.created_date,
  });

  return {
    create(user) {
      try {
        const userRow = insertUser.get(user) as UserRow;
        return toStoredUser(userRow);
      } catch (err) {
        if ((err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
          throw DomainError.Conflict(ERROR_CODE.EMAIL_ALREADY_EXISTS, 'An account with this email already exists.');
        }
        throw err;
      }
    },

    findById(id) {
      const userRow = selectById.get(id) as UserRow | undefined;
      if (!userRow) return undefined;
      return toStoredUser(userRow);
    },
  };
};
