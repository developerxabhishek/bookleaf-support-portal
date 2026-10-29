import { Types } from 'mongoose';
import { z } from 'zod';

/**
 * Parses untrusted input against a schema. A failure throws a ZodError,
 * which the error handler turns into a 400 with field-level details.
 */
export function validate(schema, input) {
  return schema.parse(input);
}

export const objectId = (label = 'id') =>
  z.string().refine((value) => Types.ObjectId.isValid(value), { message: `Invalid ${label}` });
