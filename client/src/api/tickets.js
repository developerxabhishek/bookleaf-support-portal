import { API_BASE_URL, api } from './client.js';

/** Returns `{ data: Ticket[], meta: { page, limit, total, totalPages } }`. */
export const fetchTickets = (params) => api.get('/tickets', { params }).then((res) => res.data);

export const fetchTicket = (id) => api.get(`/tickets/${id}`).then((res) => res.data.data);

export const fetchQueueSummary = () => api.get('/tickets/summary').then((res) => res.data.data);

/** `formData` carries bookId, subject, description and up to 3 `attachments`. */
export const createTicket = (formData) => api.post('/tickets', formData).then((res) => res.data.data);

export const updateTicket = (id, patch) => api.patch(`/tickets/${id}`, patch).then((res) => res.data.data);

export const addMessage = (id, message) => api.post(`/tickets/${id}/messages`, message).then((res) => res.data.data);

export const addNote = (id, body) => api.post(`/tickets/${id}/notes`, { body }).then((res) => res.data.data);

export const generateDraft = (id, { regenerate = false } = {}) =>
  api.post(`/tickets/${id}/draft`, { regenerate }).then((res) => res.data.data);

export const rerunTriage = (id) => api.post(`/tickets/${id}/triage`).then((res) => res.data.data);

export const attachmentUrl = (ticketId, attachmentId) => `${API_BASE_URL}/tickets/${ticketId}/attachments/${attachmentId}`;
