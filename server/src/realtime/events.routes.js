import { Router } from 'express';
import { currentUser } from '../middleware/authenticate.js';
import { openEventStream } from './sse.js';

export const eventsRouter = Router();

/** Long-lived SSE stream of ticket events for the logged-in user. */
eventsRouter.get('/', (req, res) => {
  openEventStream(req, res, currentUser(req));
});
