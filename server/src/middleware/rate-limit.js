import { rateLimit } from 'express-rate-limit';
import { ApiError } from '../utils/api-error.js';

const rejectWith = (message) => () => {
  throw new ApiError(429, 'RATE_LIMITED', message);
};

/** Slows down password guessing. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rejectWith('Too many login attempts. Please try again in a few minutes.'),
});

/**
 * Every new ticket triggers an LLM call, so ticket creation is capped per
 * user. This bounds AI spend if an account is abused or a client loops.
 */
export const ticketCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Mounted after `authenticate`, so the limit is per account rather than per IP.
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anonymous',
  handler: rejectWith('You have raised a lot of tickets in the last hour. Please wait a little before raising another.'),
});
