import { User } from '../models/user.model.js';
import { verifyToken } from '../modules/auth/token.js';
import { ApiError } from '../utils/api-error.js';

export const SESSION_COOKIE = 'bl_session';

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();
  const cookie = req.cookies?.[SESSION_COOKIE];
  return typeof cookie === 'string' ? cookie : undefined;
}

export async function authenticate(req, _res, next) {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthenticated();

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).lean();
  if (!user) throw ApiError.unauthenticated('Your session is no longer valid. Please log in again.');

  req.user = { id: user._id.toString(), role: user.role, name: user.name, email: user.email };
  next();
}

export function currentUser(req) {
  if (!req.user) throw ApiError.unauthenticated();
  return req.user;
}
