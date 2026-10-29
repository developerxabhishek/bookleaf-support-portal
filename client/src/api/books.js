import { api } from './client.js';

/** Returns `{ data: Book[], summary }` for the logged-in author. */
export const fetchMyBooks = () => api.get('/books').then((res) => res.data);
