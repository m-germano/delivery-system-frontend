import { api } from './api.js';

export const companyService = {
  async list(params = {}) {
    const { data } = await api.get('/companies', { params });
    return data;
  },

  async listNearby(params = {}) {
    const { data } = await api.get('/companies/nearby', { params });
    return data;
  },

  async getById(companyId) {
    const { data } = await api.get(`/companies/${companyId}`);
    return data;
  },

  async getMine() {
    const { data } = await api.get('/companies/me');
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/companies', payload);
    return data;
  },

  async updateMine(payload) {
    const { data } = await api.put('/companies/me', payload);
    return data;
  },
};
