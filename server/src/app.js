import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { getAiStatus } from './ai/openai.client.js';
import { env } from './config/env.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { booksRouter } from './modules/books/books.routes.js';
import { ticketsRouter } from './modules/tickets/tickets.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { eventsRouter } from './realtime/events.routes.js';
import { isStorageEnabled } from './storage/s3.js';

const OPENAPI_PATH = path.resolve(import.meta.dirname, '../docs/openapi.yaml');
const CLIENT_DIST = path.resolve(import.meta.dirname, '../../client/dist');

function apiRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok', ai: getAiStatus(), uploads: { enabled: isStorageEnabled() } } });
  });

  router.use('/auth', authRouter);

  // Everything below requires a valid session.
  router.use(authenticate);
  router.use('/books', booksRouter);
  router.use('/tickets', ticketsRouter);
  router.use('/users', usersRouter);
  router.use('/events', eventsRouter);

  return router;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  const openApiSpec = YAML.parse(fs.readFileSync(OPENAPI_PATH, 'utf8'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'BookLeaf Support API' }));
  app.get('/api/openapi.json', (_req, res) => res.json(openApiSpec));

  app.use(helmet());
  if (env.CLIENT_ORIGIN) {
    app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  }
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.isProduction ? 'combined' : 'dev', { skip: (req) => req.url === '/api/events' }));
  }

  app.use('/api', apiRouter());
  app.use('/api', notFoundHandler);

  // In production the API also serves the built React app (one deployable, same-origin cookies).
  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
