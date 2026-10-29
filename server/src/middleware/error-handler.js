import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { AiUnavailableError } from '../ai/openai.client.js';
import { ApiError } from '../utils/api-error.js';

function send(res, status, code, message, details) {
  res.status(status).json({ error: { code, message, ...(details !== undefined ? { details } : {}) } });
}

/** Maps every known failure to a consistent `{ error: { code, message, details? } }` response. */
export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) return;

  if (err instanceof ApiError) {
    return send(res, err.status, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    return send(res, 400, 'VALIDATION_ERROR', 'Some fields are missing or invalid.', details);
  }

  if (err instanceof AiUnavailableError) {
    return send(res, 503, 'AI_UNAVAILABLE', 'AI assistance is temporarily unavailable. You can still write a response manually.', {
      reason: err.reason,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Each attachment must be 5 MB or smaller.');
    if (err.code === 'LIMIT_FILE_COUNT') return send(res, 400, 'VALIDATION_ERROR', 'You can attach up to 3 files.');
    return send(res, 400, 'VALIDATION_ERROR', `Upload error: ${err.message}`);
  }

  if (err instanceof mongoose.Error.CastError) {
    return send(res, 400, 'VALIDATION_ERROR', `Invalid value for "${err.path}".`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return send(res, 400, 'VALIDATION_ERROR', 'Some fields are invalid.', details);
  }

  // body-parser errors carry a `type` field.
  if (err?.type === 'entity.parse.failed') return send(res, 400, 'INVALID_JSON', 'Request body is not valid JSON.');
  if (err?.type === 'entity.too.large') return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');

  if (err?.code === 11000) {
    return send(res, 409, 'CONFLICT', 'A record with these details already exists.');
  }

  console.error('[error] unhandled', err);
  send(res, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
}

export function notFoundHandler(req, res) {
  send(res, 404, 'NOT_FOUND', `No route for ${req.method} ${req.originalUrl}.`);
}
