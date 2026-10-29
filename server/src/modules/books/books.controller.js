import { z } from 'zod';
import { currentUser } from '../../middleware/authenticate.js';
import { objectId, validate } from '../../utils/validate.js';
import * as booksService from './books.service.js';

const listQuery = z.object({
  // Admin-only filter; ignored for authors, who are always scoped to themselves.
  authorId: objectId('authorId').optional(),
});

export async function list(req, res) {
  const { authorId } = validate(listQuery, req.query);
  const { books, summary } = await booksService.listBooks(currentUser(req), authorId);
  res.json({ data: books, ...(summary ? { summary } : {}) });
}
