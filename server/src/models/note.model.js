import { Schema, model } from 'mongoose';

/**
 * Internal note on a ticket, visible to admins only. Kept in its own
 * collection (rather than a flag on Message) so no author-facing query can
 * ever return one by accident.
 */
const noteSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

noteSchema.index({ ticket: 1, createdAt: 1 });

export const Note = model('Note', noteSchema);
