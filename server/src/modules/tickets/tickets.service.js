import { classifyWithRules } from '../../ai/fallback.js';
import { getAiStatus } from '../../ai/openai.client.js';
import { ACTIVE_STATUSES, TICKET_PRIORITIES, TICKET_STATUSES } from '../../domain/constants.js';
import { Book } from '../../models/book.model.js';
import { nextSequence } from '../../models/counter.model.js';
import { Message } from '../../models/message.model.js';
import { Note } from '../../models/note.model.js';
import { Ticket } from '../../models/ticket.model.js';
import { User } from '../../models/user.model.js';
import { publish } from '../../realtime/sse.js';
import { ApiError } from '../../utils/api-error.js';
import { listBooks } from '../books/books.service.js';
import { deleteAttachments, storeAttachments } from './attachments.js';
import { applyStatus, priorityFields } from './ticket-fields.js';
import {
  toAdminTicketDetail,
  toAdminTicketSummary,
  toAuthorTicketDetail,
  toAuthorTicketSummary,
  toMessageDTO,
  toNoteDTO,
} from './tickets.serializer.js';
import { triageInBackground } from './triage.service.js';

/** `actor` throughout is the logged-in user: { id, role }. */

const TICKET_NUMBER_OFFSET = 1000;

/** Authors can only ever reach their own tickets; a foreign ticket is a 404, so its existence isn't leaked. */
function accessFilter(actor, ticketId) {
  return actor.role === 'admin' ? { _id: ticketId } : { _id: ticketId, author: actor.id };
}

function withRefs(query) {
  return query.populate('author', 'name email').populate('book', 'title status').populate('assignee', 'name');
}

function notifyTicketUpdated(ticket) {
  publish({ type: 'ticket.updated', ticketId: ticket._id.toString() }, { admins: true, authorId: ticket.author.toString() });
}

export async function createTicket(actor, input, files) {
  const book = input.bookId ? await Book.findOne({ _id: input.bookId, author: actor.id }).lean() : null;
  if (input.bookId && !book) {
    throw ApiError.badRequest('The selected book was not found on your account.', [
      { field: 'bookId', message: 'Unknown book' },
    ]);
  }

  // Instant, free classification so the ticket is sortable before the LLM answers (or if it never does).
  const provisional = classifyWithRules({ subject: input.subject, description: input.description, book });
  const attachments = await storeAttachments(files, actor.id);

  let ticketId;
  try {
    const ticket = await Ticket.create({
      ticketNumber: TICKET_NUMBER_OFFSET + (await nextSequence('ticket')),
      author: actor.id,
      book: book?._id ?? null,
      subject: input.subject,
      description: input.description,
      attachments,
      category: provisional.category,
      categorySource: 'rules',
      ...priorityFields(provisional.priority, 'rules'),
      triage: { status: 'pending' },
      lastMessageBy: 'author',
    });
    ticketId = ticket._id.toString();
  } catch (error) {
    await deleteAttachments(attachments);
    throw error;
  }

  publish({ type: 'ticket.created', ticketId }, { admins: true });
  triageInBackground(ticketId);

  return getTicketDetail(actor, ticketId);
}

const SORTS = {
  // Most urgent first, and within a priority the oldest (longest-waiting) first.
  urgency: { priorityRank: 1, createdAt: 1 },
  oldest: { createdAt: 1 },
  newest: { createdAt: -1 },
  updated: { lastActivityAt: -1 },
};

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Expands the status filter; returns null for "no filter". */
function resolveStatuses(requested, role) {
  // Default: admins see the working queue; authors see everything they've raised.
  const values = requested ?? (role === 'admin' ? ['active'] : ['all']);
  if (values.includes('all')) return null;
  const statuses = new Set();
  for (const value of values) {
    if (value === 'active') ACTIVE_STATUSES.forEach((status) => statuses.add(status));
    else statuses.add(value);
  }
  return [...statuses];
}

export async function listTickets(actor, query) {
  const filter = {};
  const isAdmin = actor.role === 'admin';

  if (!isAdmin) filter.author = actor.id;

  const statuses = resolveStatuses(query.status, actor.role);
  if (statuses) filter.status = { $in: statuses };
  if (query.category?.length) filter.category = { $in: query.category };

  // Priority and assignment are internal concepts; ignored for authors.
  if (isAdmin && query.priority?.length) filter.priority = { $in: query.priority };
  if (isAdmin && query.assignee) {
    filter.assignee = query.assignee === 'me' ? actor.id : query.assignee === 'unassigned' ? null : query.assignee;
  }

  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
      ...(query.to ? { $lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
    };
  }

  if (query.q) {
    const ticketNumber = Number(query.q.replace(/^#/, ''));
    filter.$or = [
      { subject: { $regex: escapeRegex(query.q), $options: 'i' } },
      ...(Number.isInteger(ticketNumber) && ticketNumber > 0 ? [{ ticketNumber }] : []),
    ];
  }

  const sort = SORTS[query.sort ?? (isAdmin ? 'urgency' : 'updated')];
  const [total, tickets] = await Promise.all([
    Ticket.countDocuments(filter),
    withRefs(
      Ticket.find(filter)
        .sort({ ...sort, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
    ).lean(),
  ]);

  return {
    data: tickets.map(isAdmin ? toAdminTicketSummary : toAuthorTicketSummary),
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

export async function getTicketDetail(actor, ticketId) {
  const ticket = await withRefs(Ticket.findOne(accessFilter(actor, ticketId))).lean();
  if (!ticket) throw ApiError.notFound('Ticket not found.');

  const messages = await Message.find({ ticket: ticket._id }).sort({ createdAt: 1 }).populate('sender', 'name').lean();

  if (actor.role === 'author') return toAuthorTicketDetail(ticket, messages);

  const [notes, author, authorBooks] = await Promise.all([
    Note.find({ ticket: ticket._id }).sort({ createdAt: 1 }).populate('createdBy', 'name').lean(),
    User.findById(ticket.author._id).lean(),
    listBooks(actor, ticket.author._id.toString()),
  ]);

  return {
    ...toAdminTicketDetail(ticket, messages, notes),
    authorContext: {
      id: ticket.author._id.toString(),
      name: ticket.author.name,
      email: ticket.author.email,
      phone: author?.phone ?? null,
      city: author?.city ?? null,
      joinedAt: author?.joinedAt ?? null,
      books: authorBooks.books,
      royaltySummary: authorBooks.summary ?? null,
    },
  };
}

export async function getQueueSummary(actor) {
  const active = { status: { $in: ACTIVE_STATUSES } };
  const [byStatusRows, byPriorityRows, unassigned, assignedToMe, awaitingReply] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: active }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Ticket.countDocuments({ ...active, assignee: null }),
    Ticket.countDocuments({ ...active, assignee: actor.id }),
    Ticket.countDocuments({ ...active, lastMessageBy: 'author' }),
  ]);

  const countBy = (keys, rows) =>
    Object.fromEntries(keys.map((key) => [key, rows.find((row) => row._id === key)?.count ?? 0]));

  return {
    byStatus: countBy(TICKET_STATUSES, byStatusRows),
    activeByPriority: countBy(TICKET_PRIORITIES, byPriorityRows),
    unassigned,
    assignedToMe,
    awaitingReply,
    ai: getAiStatus(),
  };
}

export async function getAttachment(actor, ticketId, attachmentId) {
  const ticket = await Ticket.findOne(accessFilter(actor, ticketId)).select('attachments').lean();
  const attachment = ticket?.attachments.find((item) => item._id.toString() === attachmentId);
  if (!attachment) throw ApiError.notFound('Attachment not found.');
  return attachment;
}

export async function updateTicket(actor, ticketId, input) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw ApiError.notFound('Ticket not found.');

  if (input.status) applyStatus(ticket, input.status);
  if (input.category) {
    ticket.category = input.category;
    ticket.categorySource = 'admin';
  }
  if (input.priority) ticket.set(priorityFields(input.priority, 'admin'));
  if (input.assigneeId !== undefined) {
    if (input.assigneeId !== null) {
      const assignee = await User.exists({ _id: input.assigneeId, role: 'admin' });
      if (!assignee) throw ApiError.badRequest('Tickets can only be assigned to support team members.');
    }
    ticket.assignee = input.assigneeId;
  }

  await ticket.save();
  notifyTicketUpdated(ticket);
  return getTicketDetail(actor, ticketId);
}

export async function addMessage(actor, ticketId, input) {
  const ticket = await Ticket.findOne(accessFilter(actor, ticketId));
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  const now = new Date();

  if (actor.role === 'author') {
    if (ticket.status === 'Closed') {
      throw ApiError.conflict('This ticket is closed. Please raise a new ticket if you need more help.');
    }
    // A follow-up on a resolved ticket means it isn't resolved.
    if (ticket.status === 'Resolved') applyStatus(ticket, 'Open');
    // The cached AI draft no longer answers the latest message.
    if (ticket.draft.status === 'ready') ticket.draft.status = 'stale';
  } else {
    ticket.firstResponseAt ??= now;
    // Replying to an unassigned ticket claims it, so two agents don't answer the same author.
    if (!ticket.assignee) ticket.assignee = actor.id;
    applyStatus(ticket, input.status ?? (ticket.status === 'Open' ? 'In Progress' : ticket.status));
    // The draft has been used (or deliberately not used); the next one should reflect the new state.
    ticket.draft = { status: 'none' };
  }

  ticket.lastMessageBy = actor.role;
  ticket.lastActivityAt = now;

  const message = await Message.create({
    ticket: ticket._id,
    sender: actor.id,
    senderRole: actor.role,
    body: input.body,
    aiDraftUsed: actor.role === 'admin' && Boolean(input.aiDraftUsed),
  });
  await ticket.save();

  publish(
    { type: 'message.created', ticketId, ticketNumber: ticket.ticketNumber, senderRole: actor.role },
    { admins: true, authorId: ticket.author.toString() },
  );

  const populated = await Message.findById(message._id).populate('sender', 'name').lean();
  return toMessageDTO(populated, actor.role);
}

export async function addNote(actor, ticketId, body) {
  const exists = await Ticket.exists({ _id: ticketId });
  if (!exists) throw ApiError.notFound('Ticket not found.');

  const note = await Note.create({ ticket: ticketId, createdBy: actor.id, body });
  // Admins only: notes must never reach an author's stream.
  publish({ type: 'note.created', ticketId }, { admins: true });

  const populated = await Note.findById(note._id).populate('createdBy', 'name').lean();
  return toNoteDTO(populated);
}
