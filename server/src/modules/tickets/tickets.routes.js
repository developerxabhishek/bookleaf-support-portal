import { Router } from 'express';
import { requireRole } from '../../middleware/authorize.js';
import { ticketCreationLimiter } from '../../middleware/rate-limit.js';
import { MAX_ATTACHMENTS, attachmentUpload } from './attachments.js';
import * as controller from './tickets.controller.js';

/**
 * Shared by both portals. Routes open to both roles scope their queries by
 * the current user inside the service (authors only see their own tickets).
 */
export const ticketsRouter = Router();

ticketsRouter.get('/', controller.list);
ticketsRouter.get('/summary', requireRole('admin'), controller.summary);
ticketsRouter.post(
  '/',
  requireRole('author'),
  ticketCreationLimiter,
  attachmentUpload.array('attachments', MAX_ATTACHMENTS),
  controller.create,
);

ticketsRouter.get('/:id', controller.detail);
ticketsRouter.patch('/:id', requireRole('admin'), controller.update);

ticketsRouter.post('/:id/messages', controller.addMessage);
ticketsRouter.post('/:id/notes', requireRole('admin'), controller.addNote);
ticketsRouter.post('/:id/draft', requireRole('admin'), controller.draft);
ticketsRouter.post('/:id/triage', requireRole('admin'), controller.retriage);

ticketsRouter.get('/:id/attachments/:attachmentId', controller.downloadAttachment);
