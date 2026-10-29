import { api } from './client.js';

/** `{ status, ai, uploads: { enabled } }`: which optional features the server has configured. */
export const fetchHealth = () => api.get('/health').then((res) => res.data.data);
