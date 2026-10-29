import { api } from './client.js';

export const fetchAdmins = () => api.get('/users/admins').then((res) => res.data.data);
