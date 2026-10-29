import { Schema, model } from 'mongoose';
import {
  CLASSIFICATION_SOURCES,
  ROLES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../domain/constants.js';

// Each attachment keeps its own _id, which is the id used in download URLs.
const attachmentSchema = new Schema({
  /** Object key in the attachments S3 bucket. */
  key: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
});

/**
 * The AI's own suggestion, stored separately from the ticket's effective
 * category/priority so overrides stay auditable (and measurable).
 */
const triageSchema = new Schema(
  {
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    category: { type: String, enum: TICKET_CATEGORIES },
    priority: { type: String, enum: TICKET_PRIORITIES },
    confidence: Number,
    reasoning: String,
    model: String,
    error: String,
    completedAt: Date,
  },
  { _id: false },
);

/** Cached AI reply draft, generated once when an admin first opens the ticket. */
const draftSchema = new Schema(
  {
    status: { type: String, enum: ['none', 'ready', 'stale'], default: 'none' },
    body: String,
    model: String,
    kbSections: [String],
    promptTokens: Number,
    completionTokens: Number,
    generatedAt: Date,
  },
  { _id: false },
);

const ticketSchema = new Schema(
  {
    ticketNumber: { type: Number, required: true, unique: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Null for "General / Account Level" queries. */
    book: { type: Schema.Types.ObjectId, ref: 'Book', default: null },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    attachments: { type: [attachmentSchema], default: [] },
    status: { type: String, enum: TICKET_STATUSES, default: 'Open' },
    category: { type: String, enum: TICKET_CATEGORIES, required: true },
    categorySource: { type: String, enum: CLASSIFICATION_SOURCES, required: true },
    priority: { type: String, enum: TICKET_PRIORITIES, required: true },
    prioritySource: { type: String, enum: CLASSIFICATION_SOURCES, required: true },
    /** Denormalised from priority (Critical = 0) so the queue can sort by urgency. */
    priorityRank: { type: Number, required: true },
    triage: { type: triageSchema, default: () => ({ status: 'pending' }) },
    draft: { type: draftSchema, default: () => ({ status: 'none' }) },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lastMessageBy: { type: String, enum: ROLES, default: 'author' },
    lastActivityAt: { type: Date, default: () => new Date() },
    firstResponseAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Admin queue: filter by status, sort by urgency then age.
ticketSchema.index({ status: 1, priorityRank: 1, createdAt: 1 });
// Author "My Tickets": own tickets, newest first.
ticketSchema.index({ author: 1, createdAt: -1 });
ticketSchema.index({ assignee: 1, status: 1 });

export const Ticket = model('Ticket', ticketSchema);
