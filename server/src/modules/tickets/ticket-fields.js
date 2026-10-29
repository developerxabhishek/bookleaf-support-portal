import { PRIORITY_RANK } from '../../domain/constants.js';

/** Priority and its sort rank must always change together. */
export function priorityFields(priority, source) {
  return { priority, prioritySource: source, priorityRank: PRIORITY_RANK[priority] };
}

/** Sets status and keeps `resolvedAt` consistent with it. */
export function applyStatus(ticket, status) {
  if (ticket.status === status) return;
  ticket.status = status;
  const isDone = status === 'Resolved' || status === 'Closed';
  ticket.resolvedAt = isDone ? (ticket.resolvedAt ?? new Date()) : null;
}
