import { ApiError } from '../utils/api-error.js';

/**
 * Role gate for whole routes. Per-record ownership (an author may only see
 * their own tickets and books) is enforced in the services, which scope every
 * query by the current user.
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthenticated();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}
