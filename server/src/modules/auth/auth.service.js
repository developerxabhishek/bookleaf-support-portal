import bcrypt from 'bcryptjs';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/api-error.js';
import { signToken } from './token.js';

export function toUserDTO(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash').lean();
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw ApiError.unauthenticated('Incorrect email or password.');
  }

  const token = signToken({ sub: user._id.toString(), role: user.role });
  return { token, user: toUserDTO(user) };
}
