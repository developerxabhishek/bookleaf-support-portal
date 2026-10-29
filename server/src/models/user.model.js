import { Schema, model } from 'mongoose';
import { ROLES } from '../domain/constants.js';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never returned by default; login explicitly selects it.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },
    /** ID from the source dataset (e.g. AUTH001), kept for traceability. */
    externalId: { type: String, unique: true, sparse: true },
    phone: String,
    city: String,
    joinedAt: Date,
  },
  { timestamps: true },
);

export const User = model('User', userSchema);
