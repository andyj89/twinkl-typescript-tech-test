import express, { Request, Response } from 'express';
import { asyncHandler } from './middleware/asyncHandler';
import { errorHandler } from './middleware/errorHandler';
import { validate } from './middleware/validate';
import { createUserRepository } from './repositories/userRepository';
import { signupSchema } from './schemas/user';
import { createUserService } from './services/userService';

const userService = createUserService(createUserRepository());

export const app = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.post('/users', validate(signupSchema), asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
}));

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
}));

app.use(errorHandler);
