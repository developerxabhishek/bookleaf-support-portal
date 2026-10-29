import { User } from '../../models/user.model.js';
import { toUserDTO } from '../auth/auth.service.js';

/** Support team members, for the ticket assignee picker. */
export async function listAdmins(_req, res) {
  const admins = await User.find({ role: 'admin' }).sort({ name: 1 }).lean();
  res.json({ data: admins.map(toUserDTO) });
}
