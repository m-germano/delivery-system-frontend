import { api } from './api.js';

export const reviewService = {
  async createOrderReview(orderId, payload) {
    const { data } = await api.post(`/orders/${orderId}/review`, payload);
    return data;
  },

  async listCompanyReviews(companyId, params = {}) {
    const { data } = await api.get(`/companies/${companyId}/reviews`, { params });
    return data;
  },

  async getCompanyReviewSummary(companyId) {
    const { data } = await api.get(`/companies/${companyId}/reviews/summary`);
    return data;
  },

  async listMyCompanyReviews(params = {}) {
    const { data } = await api.get('/companies/me/reviews', { params });
    return data;
  },
};
