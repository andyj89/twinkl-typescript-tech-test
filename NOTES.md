# Notes

## Decisions

- **Validation.** A zod 4 schema for the signup body runs in a `validate` middleware. Each rule's message is a stable error code, so a client can branch on the code and never on message text. All failing password rules are reported together.
- **Errors.** Failures caused by the caller are a `DomainError` with a code, a message, a 4xx status and optional `details`. One Express error handler renders them. Anything else is a generic 500 and the real cause is only logged.
- **Passwords.** Hashed with argon2id using the `argon2` package. Each hash gets its own random salt, stored inside the hash string with the parameters.
- **Storage.** SQLite through `better-sqlite3`, behind a small user repository so the service holds no SQL. The email column is `UNIQUE COLLATE NOCASE`, so duplicate checks ignore case.
- **Duplicate signups return a 409 `EMAIL_ALREADY_EXISTS`.** This is deliberate. The client can tell the user the email is taken, which the brief asks for. It does reveal that an email is registered. The alternative is to answer every signup the same way ("check your email") and email the existing owner, which needs email delivery and verification.
- **Created date** is accepted from the client because the brief lists it as an input.
- **Scope.** The brief asks for signup and get-user, so there is no login endpoint.
- **Tests.** Unit tests sit next to the code they cover. End-to-end tests in `test/` call the real Express app over HTTP with an in-memory database. That is why the app is built in `app.ts` and only started in `index.ts`, so a test can load it without opening a port.
- **Node 22 or later.** `better-sqlite3` 13 requires it, so `engines` and the README say so. `node:sqlite` is built into Node 22 and could replace it.

## With more time

- Rate limiting on signup, the usual mitigation for probing the 409.
- Email verification before an account is usable.
- Authentication on `GET /users/:id`, which is currently open to anyone holding an id.
- Login, with sessions or tokens.
- Set the created date on the server.
- Database migrations in place of `CREATE TABLE IF NOT EXISTS`.
