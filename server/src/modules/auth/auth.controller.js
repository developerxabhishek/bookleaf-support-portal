import { z } from 'zod';
import { env } from '../../config/env.js';
import { SESSION_COOKIE, currentUser } from '../../middleware/authenticate.js';
import { validate } from '../../utils/validate.js';
import * as authService from './auth.service.js';

const loginBody = z.object({
  email: z.email('Enter a valid email address').trim(),
  password: z.string().min(1, 'Password is required'),
});

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function sessionCookieOptions() {
  // Cross-origin deployments (client and API on different sites) need SameSite=None.
  const crossSite = Boolean(env.CLIENT_ORIGIN);
  return {
    httpOnly: true,
    secure: env.isProduction || crossSite,
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
  };
}

export async function login(req, res) {
  const { email, password } = validate(loginBody, req.body ?? {});
  const { token, user } = await authService.login(email, password);

  res.cookie(SESSION_COOKIE, token, { ...sessionCookieOptions(), maxAge: SEVEN_DAYS_MS });
  // The token is also returned for API clients (Postman/Swagger); the web app relies on the httpOnly cookie.
  res.json({ data: { user, token } });
}

export function logout(_req, res) {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
}

export function me(req, res) {
  const user = currentUser(req);
  res.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
