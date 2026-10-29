/**
 * Role-specific views of a ticket. Authors never receive priority, AI
 * metadata, assignee or internal notes; those exist only on admin DTOs.
 *
 * Inputs are lean documents with author, book, assignee (and message sender /
 * note createdBy) populated.
 */

const id = (value) => value.toString();

const toBookRef = (book) => (book ? { id: id(book._id), title: book.title, status: book.status } : null);

// The storage key stays server-side; clients download through the API by attachment id.
const toAttachmentDTO = (attachment) => ({
  id: id(attachment._id),
  filename: attachment.filename,
  mimeType: attachment.mimeType,
  size: attachment.size,
});

export function toAuthorTicketSummary(ticket) {
  return {
    id: id(ticket._id),
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    category: ticket.category,
    book: toBookRef(ticket.book),
    attachmentCount: ticket.attachments.length,
    lastMessageBy: ticket.lastMessageBy,
    lastActivityAt: ticket.lastActivityAt,
    createdAt: ticket.createdAt,
    resolvedAt: ticket.resolvedAt,
  };
}

export function toAdminTicketSummary(ticket) {
  return {
    ...toAuthorTicketSummary(ticket),
    categorySource: ticket.categorySource,
    priority: ticket.priority,
    prioritySource: ticket.prioritySource,
    triageStatus: ticket.triage.status,
    author: { id: id(ticket.author._id), name: ticket.author.name, email: ticket.author.email },
    assignee: ticket.assignee ? { id: id(ticket.assignee._id), name: ticket.assignee.name } : null,
    firstResponseAt: ticket.firstResponseAt,
  };
}

export function toDraftDTO(draft) {
  return {
    status: draft.status,
    body: draft.body ?? null,
    model: draft.model ?? null,
    kbSections: draft.kbSections ?? [],
    promptTokens: draft.promptTokens ?? null,
    completionTokens: draft.completionTokens ?? null,
    generatedAt: draft.generatedAt ?? null,
  };
}

export function toMessageDTO(message, viewer) {
  return {
    id: id(message._id),
    body: message.body,
    senderRole: message.senderRole,
    senderName: message.sender?.name ?? 'BookLeaf Support',
    createdAt: message.createdAt,
    ...(viewer === 'admin' ? { aiDraftUsed: message.aiDraftUsed } : {}),
  };
}

export function toNoteDTO(note) {
  return {
    id: id(note._id),
    body: note.body,
    createdBy: note.createdBy ? { id: id(note.createdBy._id), name: note.createdBy.name } : null,
    createdAt: note.createdAt,
  };
}

export function toAuthorTicketDetail(ticket, messages) {
  return {
    ...toAuthorTicketSummary(ticket),
    description: ticket.description,
    attachments: ticket.attachments.map(toAttachmentDTO),
    messages: messages.map((message) => toMessageDTO(message, 'author')),
  };
}

export function toAdminTicketDetail(ticket, messages, notes) {
  return {
    ...toAdminTicketSummary(ticket),
    description: ticket.description,
    attachments: ticket.attachments.map(toAttachmentDTO),
    messages: messages.map((message) => toMessageDTO(message, 'admin')),
    notes: notes.map(toNoteDTO),
    triage: {
      status: ticket.triage.status,
      category: ticket.triage.category ?? null,
      priority: ticket.triage.priority ?? null,
      confidence: ticket.triage.confidence ?? null,
      reasoning: ticket.triage.reasoning ?? null,
      model: ticket.triage.model ?? null,
      error: ticket.triage.error ?? null,
      completedAt: ticket.triage.completedAt ?? null,
    },
    draft: toDraftDTO(ticket.draft),
  };
}
