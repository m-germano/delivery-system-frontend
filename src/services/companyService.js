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

  async updateOpenStatus(isOpen) {
    const { data } = await api.patch('/companies/me/open-status', {
      is_open: isOpen,
    });

    return data;
  },

  async getMyOrderSettings() {
    const { data } = await api.get('/companies/me/order-settings');
    return data;
  },

  async updateMyOrderSettings(payload) {
    const { data } = await api.put('/companies/me/order-settings', payload);
    return data;
  },

  async getOrderSettings(companyId) {
    const { data } = await api.get(`/companies/${companyId}/order-settings`);
    return data;
  },
};