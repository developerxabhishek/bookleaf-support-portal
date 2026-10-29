import { Schema, model } from 'mongoose';
import { ROLES } from '../domain/constants.js';

/** A message in the author-visible conversation thread of a ticket. */
const messageSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ROLES, required: true },
    body: { type: String, required: true, trim: true },
    /** Admin replies only: whether the reply started from the AI draft. */
    aiDraftUsed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ ticket: 1, createdAt: 1 });

export const Message = model('Message', messageSchema);
