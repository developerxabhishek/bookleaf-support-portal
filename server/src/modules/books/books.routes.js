import { Router } from 'express';
import * as controller from './books.controller.js';

export const booksRouter = Router();

booksRouter.get('/', controller.list);
