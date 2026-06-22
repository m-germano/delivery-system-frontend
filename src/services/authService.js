import { api } from './api.js';

export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async completionStatus() {
    const { data } = await api.get('/auth/completion-status');
    return data;
  },
};
