import { classifyWithAi } from '../../ai/classifier.js';
import { AiUnavailableError } from '../../ai/openai.client.js';
import { Book } from '../../models/book.model.js';
import { Ticket } from '../../models/ticket.model.js';
import { publish } from '../../realtime/sse.js';
import { ApiError } from '../../utils/api-error.js';
import { priorityFields } from './ticket-fields.js';

/**
 * Tickets are created with an instant rule-based category/priority, so this
 * only ever upgrades them. If an admin has already overridden a field, the AI
 * suggestion is still recorded but never replaces the admin's choice.
 * Throws AiUnavailableError (after recording the failure) if the AI call fails.
 */
export async function runAiTriage(ticketId) {
  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) throw ApiError.notFound('Ticket not found.');
  const book = ticket.book ? await Book.findById(ticket.book).lean() : null;

  try {
    const result = await classifyWithAi({ subject: ticket.subject, description: ticket.description, book }, ticketId);

    await Ticket.updateOne(
      { _id: ticket._id },
      { $set: { triage: { status: 'completed', ...result, completedAt: new Date() } } },
    );
    // Conditional updates so a concurrent admin override always wins.
    await Ticket.updateOne(
      { _id: ticket._id, categorySource: { $ne: 'admin' } },
      { $set: { category: result.category, categorySource: 'ai' } },
    );
    await Ticket.updateOne(
      { _id: ticket._id, prioritySource: { $ne: 'admin' } },
      { $set: priorityFields(result.priority, 'ai') },
    );
  } catch (error) {
    const reason = error instanceof AiUnavailableError ? error.reason : 'upstream_error';
    await Ticket.updateOne({ _id: ticket._id }, { $set: { 'triage.status': 'failed', 'triage.error': reason } });
    throw error;
  } finally {
    publish({ type: 'ticket.updated', ticketId }, { admins: true });
  }
}

/** Fire-and-forget triage after ticket creation; the rule-based result stands if it fails. */
export function triageInBackground(ticketId) {
  runAiTriage(ticketId).catch((error) => {
    if (!(error instanceof AiUnavailableError)) {
      console.error(`[triage] unexpected failure for ticket ${ticketId}`, error);
    }
  });
}

/** Picks up tickets whose triage was interrupted (e.g. by a server restart). */
export async function resumePendingTriage() {
  const pending = await Ticket.find({ 'triage.status': 'pending' }).select('_id').lean();
  for (const { _id } of pending) {
    await runAiTriage(_id.toString()).catch(() => undefined);
  }
  if (pending.length > 0) console.log(`[triage] resumed ${pending.length} pending ticket(s)`);
}
