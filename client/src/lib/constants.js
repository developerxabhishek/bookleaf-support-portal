// Mirrors server/src/domain/constants.js.
export const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const ACTIVE_STATUSES = ['Open', 'In Progress'];

export const TICKET_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

export const TICKET_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Response targets the queue uses to flag tickets waiting too long for a reply.
 * An operational assumption for the demo, not a published BookLeaf policy.
 */
export const RESPONSE_TARGET_HOURS = { Critical: 4, High: 24, Medium: 48, Low: 72 };

export const ATTACHMENT_RULES = {
  maxFiles: 3,
  maxBytes: 5 * 1024 * 1024,
  accept: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};
