import { api } from './api.js';

export const deliveryService = {
  async getCourierProfile() {
    const { data } = await api.get('/couriers/me');
    return data;
  },

  async updateAvailability(payload) {
    const { data } = await api.patch('/couriers/me/availability', payload);
    return data;
  },

  async updateCourierLocation(payload) {
    const { data } = await api.patch('/couriers/me/location', payload);
    return data;
  },

  async listAvailable(params = {}) {
    const { data } = await api.get('/deliveries/available', { params });
    return data;
  },

  async listMine(params = {}) {
    const { data } = await api.get('/deliveries/my', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/deliveries/${id}`);
    return data;
  },

  async accept(id) {
    const { data } = await api.patch(`/deliveries/${id}/accept`);
    return data;
  },

  async finish(id, payload) {
    const { data } = await api.patch(`/deliveries/${id}/finish`, payload);
    return data;
  },

  async updateLocation(id, payload) {
    const { data } = await api.patch(`/deliveries/${id}/location`, payload);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/deliveries/${id}/status`, { status });
    return data;
  },
};
