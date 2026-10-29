import { Schema, model } from 'mongoose';

const bookSchema = new Schema(
  {
    /** ID from the source dataset (e.g. BK001). */
    externalId: { type: String, required: true, unique: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    isbn: { type: String, required: true },
    genre: { type: String, required: true },
    /** Null while the book is still in production. */
    publicationDate: { type: Date, default: null },
    /** "Published & Live" or "In Production - <stage>". */
    status: { type: String, required: true },
    mrp: { type: Number, default: null },
    authorRoyaltyPerCopy: { type: Number, default: null },
    totalCopiesSold: { type: Number, default: 0, min: 0 },
    totalRoyaltyEarned: { type: Number, default: 0, min: 0 },
    royaltyPaid: { type: Number, default: 0, min: 0 },
    royaltyPending: { type: Number, default: 0, min: 0 },
    lastRoyaltyPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Book = model('Book', bookSchema);
