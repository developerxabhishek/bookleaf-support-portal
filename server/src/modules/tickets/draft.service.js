import { draftReply } from '../../ai/drafter.js';
import { Book } from '../../models/book.model.js';
import { Message } from '../../models/message.model.js';
import { Note } from '../../models/note.model.js';
import { Ticket } from '../../models/ticket.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/api-error.js';
import { toDraftDTO } from './tickets.serializer.js';

/**
 * Cost controls for drafting:
 * - Drafts are generated lazily (first time an admin opens the ticket), then
 *   cached on the ticket. Re-opening is free; only "Regenerate" or a new
 *   author message triggers another call.
 * - Only the most recent turns and notes are sent, not the full history.
 * - Concurrent requests for the same ticket share a single LLM call.
 */
const CONVERSATION_WINDOW = 6;
const NOTES_WINDOW = 3;

const inFlight = new Map();

export async function getOrGenerateDraft(ticketId, { regenerate = false } = {}) {
  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) throw ApiError.notFound('Ticket not found.');

  // A stale draft (author replied since) is still returned; the UI offers to regenerate it.
  if (!regenerate && ticket.draft.status !== 'none') return toDraftDTO(ticket.draft);

  const existing = inFlight.get(ticketId);
  if (existing) return existing;

  const job = generateDraft(ticket).finally(() => inFlight.delete(ticketId));
  inFlight.set(ticketId, job);
  return job;
}

async function generateDraft(ticket) {
  const [author, books, recentMessages, totalMessages, recentNotes] = await Promise.all([
    User.findById(ticket.author).lean(),
    Book.find({ author: ticket.author }).lean(),
    Message.find({ ticket: ticket._id }).sort({ createdAt: -1 }).limit(CONVERSATION_WINDOW).lean(),
    Message.countDocuments({ ticket: ticket._id }),
    Note.find({ ticket: ticket._id }).sort({ createdAt: -1 }).limit(NOTES_WINDOW).lean(),
  ]);
  if (!author) throw ApiError.notFound('Ticket author not found.');

  const focusBook = ticket.book ? (books.find((book) => book._id.equals(ticket.book)) ?? null) : null;
  const otherBooks = books.filter((book) => !ticket.book || !book._id.equals(ticket.book));
  const conversation = recentMessages.reverse().map((message) => ({
    from: message.senderRole === 'author' ? 'author' : 'support',
    body: message.body,
    at: message.createdAt,
  }));

  const result = await draftReply(
    {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      createdAt: ticket.createdAt,
      status: ticket.status,
      category: ticket.category,
      author: { name: author.name, joinedAt: author.joinedAt ?? null },
      book: focusBook,
      otherBooks,
      conversation,
      omittedTurns: totalMessages - conversation.length,
      internalNotes: recentNotes.reverse().map((note) => note.body),
      today: new Date(),
    },
    ticket._id.toString(),
  );

  const draft = { status: 'ready', ...result, generatedAt: new Date() };
  await Ticket.updateOne({ _id: ticket._id }, { $set: { draft } });
  return toDraftDTO(draft);
}
