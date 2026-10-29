import { Router } from 'express';
import { requireRole } from '../../middleware/authorize.js';
import * as controller from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/admins', requireRole('admin'), controller.listAdmins);
