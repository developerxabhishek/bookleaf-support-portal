/**
 * TanStack Query cache keys in one place. Every ticket list key starts with
 * 'tickets', so one invalidation refreshes all lists after a real-time event.
 */
export const queryKeys = {
  session: ['session'],
  health: ['health'],
  books: ['books'],
  ticketLists: ['tickets'],
  tickets: (params) => ['tickets', params],
  ticket: (id) => ['ticket', id],
  queueSummary: ['queue-summary'],
  admins: ['admins'],
};
