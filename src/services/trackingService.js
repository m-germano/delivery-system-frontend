import { api } from './api.js';

export const trackingService = {
  async getOrderTracking(orderId) {
    const { data } = await api.get(`/orders/${orderId}/tracking`);
    return data;
  },
};
