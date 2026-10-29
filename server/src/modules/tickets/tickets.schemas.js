import { z } from 'zod';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../../domain/constants.js';
import { objectId } from '../../utils/validate.js';

/** Comma-separated query values, e.g. `?priority=Critical,High`. */
const csvOf = (values) =>
  z
    .string()
    .transform((raw) => raw.split(',').map((value) => value.trim()).filter(Boolean))
    .pipe(z.array(z.enum(values)));

export const ticketParams = z.object({ id: objectId('ticket id') });

export const attachmentParams = z.object({
  id: objectId('ticket id'),
  attachmentId: objectId('attachment id'),
});

export const createTicketBody = z.object({
  // Empty or "general" means a General / Account Level query.
  bookId: z
    .union([objectId('bookId'), z.literal('general'), z.literal('')])
    .optional()
    .transform((value) => (value && value !== 'general' ? value : null)),
  subject: z
    .string({ error: 'Subject is required' })
    .trim()
    .min(5, 'Subject must be at least 5 characters')
    .max(150, 'Subject must be at most 150 characters'),
  description: z
    .string({ error: 'Description is required' })
    .trim()
    .min(20, 'Please describe the issue in at least 20 characters')
    .max(5000, 'Description must be at most 5,000 characters'),
});

export const TICKET_SORTS = ['urgency', 'oldest', 'newest', 'updated'];

export const listTicketsQuery = z.object({
  /** Statuses, or the shortcuts "active" (Open + In Progress) and "all". */
  status: csvOf([...TICKET_STATUSES, 'active', 'all']).optional(),
  category: csvOf(TICKET_CATEGORIES).optional(),
  priority: csvOf(TICKET_PRIORITIES).optional(),
  assignee: z.union([z.literal('me'), z.literal('unassigned'), objectId('assignee')]).optional(),
  from: z.iso.date('Use YYYY-MM-DD for "from"').optional(),
  to: z.iso.date('Use YYYY-MM-DD for "to"').optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(TICKET_SORTS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateTicketBody = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assigneeId: z.union([objectId('assigneeId'), z.null()]).optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Provide at least one of status, category, priority or assigneeId',
  });

export const addMessageBody = z.object({
  body: z.string({ error: 'Message is required' }).trim().min(1, 'Message cannot be empty').max(5000),
  /** Admin only: whether the reply started from the AI draft (for draft-acceptance metrics). */
  aiDraftUsed: z.boolean().optional(),
  /** Admin only: set the ticket status in the same action, e.g. "Send & resolve". */
  status: z.enum(TICKET_STATUSES).optional(),
});

export const addNoteBody = z.object({
  body: z.string({ error: 'Note is required' }).trim().min(1, 'Note cannot be empty').max(2000),
});

export const draftBody = z.object({
  regenerate: z.boolean().optional(),
});
