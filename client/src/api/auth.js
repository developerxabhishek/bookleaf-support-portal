import { api } from './client.js';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((res) => res.data.data.user);

export const logout = () => api.post('/auth/logout');

export const fetchSession = () => api.get('/auth/me').then((res) => res.data.data);
