import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ROLES } from '../../domain/constants.js';
import { ApiError } from '../../utils/api-error.js';

/** payload: { sub: userId, role } */
export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded.sub !== 'string' || !ROLES.includes(decoded.role)) {
      throw new Error('Unexpected token payload');
    }
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    throw ApiError.unauthenticated('Your session has expired. Please log in again.');
  }
}
