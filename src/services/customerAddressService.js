import { api } from './api.js';

export const customerAddressService = {
  async listMine() {
    const { data } = await api.get('/customer-addresses/me');
    return data;
  },

  async getLocationStatus() {
    const { data } = await api.get('/customer-addresses/location-status');
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/customer-addresses', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/customer-addresses/${id}`, payload);
    return data;
  },

  async setDefault(id) {
    const { data } = await api.patch(`/customer-addresses/${id}/default`);
    return data;
  },

  async remove(id) {
    await api.delete(`/customer-addresses/${id}`);
  },
};
