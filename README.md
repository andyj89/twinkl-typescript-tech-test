# Twinkl TypeScript Test

- [Task](#task)
- [Development Environment Setup](#setup)
- [What we are looking for](#what-we-are-looking-for)

## Task

Your task is to implement a backend API (no front-end is required).

These are the requirements for the system:

1. User Signup Endpoint
    1. A `POST` endpoint, that accepts JSON, containing the user full name, password, email address, created date, and the user type (one of a student, teacher, parent or private tutor).
    1. Validation. The app should check that the fields submitted are not empty. The app should also check that the password matches the following rules:
        1. Between 8 and 64 characters
        1. Must contain at least one digit (0-9)
        1. Must contain at least one lowercase letter (a-z)
        1. Must contain at least one uppercase letter (A-Z)
    1. When validation fails the app should return an appropriate status code with error/s that can be used by the client
1. Save the signup information to a data store. We recommend an in-memory data store (i.e an array) or a lightweight file database like SQLLite.
1. User Signup Details
    1. A `GET` endpoint that takes a user ID and returns the user details as JSON.
1. Create whatever level of testing and documentation you consider appropriate

## What we are looking for

* Submit something that we can run locally
* Commiting changes with good messages as you go is very helpful
* You can update the README or add a NOTES.md detailing any decisions/tradeoffs you made, or changes you would make with more time
* Clean, secure, modular code written to your own standards of what good looks like. Add concise comments in the code if you want to explain a decision. 
* Pragmatism. We are not looking for complex solutions, and there is no hidden trick requirement in our task ;) 
* Feel free to install and use additional packages

## Setup

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/): Ensure that Node.js version 22 or higher is installed on your system, as this project utilizes the latest versions of TypeScript and Nodemon.
- [npm](https://www.npmjs.com/): npm is the package manager for Node.js and comes with the Node.js installation.

### Installation

This will install a basic [Express](https://expressjs.com/) app with Typescript.

If you have been provided with a Github URL, clone the repository to your local machine:

```
git clone https://github.com/twinkltech/twinkl-typescript-tech-test.git
```

If you have been provided with a zip file, download to your computer and unzip.

Navigate to the directory:

```
cd twinkl-typescript-tech-test
```

Install the dependencies:

```
npm i
```

### Usage

In development the following command will start the server and use `nodemon` to auto-reload the server based on file changes

```
npm run dev
```

The server will start at `http://localhost:3000` by default. You can change the port in `src/index.ts` 

There are no tests in the project at the moment, but a command is available to run:

```
npm run test
```

There are also commands to build and start a server without nodemon:

```
npm run build
npm start
```

## The API

Design decisions and trade-offs are in [NOTES.md](NOTES.md).

The SQLite driver (`better-sqlite3` 13) requires Node 22 or later.

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on |
| `DB_PATH` | `data/twinkl.db` | SQLite file, created on first run. Use `:memory:` for a throwaway database |

### Tests and checks

```
npm test            # unit tests, then end-to-end tests
npm run test:unit   # unit tests, next to the code they cover in src/
npm run test:e2e    # end-to-end tests over HTTP, in test/
npm run typecheck
npm run lint
```

### Sign up

`POST /users` with a JSON body.

| Field | Rules |
| --- | --- |
| `fullName` | Required, not empty |
| `email` | Required, a valid email. Stored lowercase and unique, ignoring case |
| `password` | 8 to 64 characters with at least one digit, one lowercase and one uppercase letter |
| `createdDate` | ISO 8601 date and time, for example `2024-05-01T10:00:00Z` |
| `userType` | One of `student`, `teacher`, `parent`, `private_tutor` |

```
curl -X POST localhost:3000/users -H 'Content-Type: application/json' -d '{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "Passw0rdOk",
  "createdDate": "2024-05-01T10:00:00Z",
  "userType": "teacher"
}'
```

Responds `201` with the saved user. The password is hashed with argon2id and is never returned.

```json
{
  "id": "6bbc25e4-a9e9-4b42-bfb7-0d48385876f9",
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "userType": "teacher",
  "createdDate": "2024-05-01T10:00:00Z"
}
```

### Get a user

`GET /users/:id` responds `200` with the same user object, or `404` if the id is unknown.

### Errors

Every error has the same shape. Clients should act on `code` and not on `message`. A validation failure lists every problem in `details`, one entry per failing rule.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      { "field": "password", "code": "PASSWORD_TOO_SHORT" },
      { "field": "password", "code": "PASSWORD_MISSING_DIGIT" }
    ]
  }
}
```

| Status | `error.code` | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | One or more fields are invalid, see `details` |
| 400 | `INVALID_JSON` | The request body is not valid JSON |
| 404 | `USER_NOT_FOUND` | No user has that id |
| 409 | `EMAIL_ALREADY_EXISTS` | The email is already registered |
| 500 | `INTERNAL_ERROR` | Unexpected server error, details are only logged |

Codes in `details[].code`:

| Code | Field | Meaning |
| --- | --- | --- |
| `FIELD_REQUIRED` | `fullName`, `email`, `password` | Missing or empty |
| `INVALID_BODY` | `body` | The body is not a JSON object |
| `INVALID_EMAIL` | `email` | Not a valid email address |
| `INVALID_DATE` | `createdDate` | Missing or not an ISO 8601 date and time |
| `INVALID_USER_TYPE` | `userType` | Missing or not one of the allowed values |
| `PASSWORD_TOO_SHORT` | `password` | Fewer than 8 characters |
| `PASSWORD_TOO_LONG` | `password` | More than 64 characters |
| `PASSWORD_MISSING_DIGIT` | `password` | No digit |
| `PASSWORD_MISSING_LOWERCASE` | `password` | No lowercase letter |
| `PASSWORD_MISSING_UPPERCASE` | `password` | No uppercase letter |

