import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { loginLimiter } from '../../middleware/rate-limit.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', loginLimiter, controller.login);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', authenticate, controller.me);
