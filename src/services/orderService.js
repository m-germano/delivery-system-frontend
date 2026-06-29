import { api } from './api.js';

export const orderService = {
  async calculate(payload) {
    const { data } = await api.post('/orders/calculate', payload);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/orders', payload);
    return data;
  },

  async createPix(payload) {
    const pixPayload = {
      ...payload,
      payment_method: 'PIX_ONLINE',
    };
    const { data } = await api.post('/orders/pix', pixPayload);
    return data;
  },

  async getCompanyPaymentAvailability(companyId) {
    const { data } = await api.get(`/companies/${companyId}/payment-availability`);
    return data;
  },

  async getPaymentStatus(id) {
    const { data } = await api.get(`/orders/${id}/payment-status`);
    return data;
  },

  async cancelPixPayment(id) {
    const { data } = await api.post(`/orders/${id}/payments/pix/cancel`);
    return data;
  },

  async regeneratePixPayment(id) {
    const { data } = await api.post(`/orders/${id}/payments/pix/regenerate`);
    return data;
  },

  async switchToPayOnDelivery(id) {
    const { data } = await api.patch(`/orders/${id}/payments/switch-to-delivery`);
    return data;
  },

  async listMine(params = {}) {
    const { data } = await api.get('/orders/my', { params });
    return data;
  },

  async listCompany(params = {}) {
    const { data } = await api.get('/orders/company', { params });
    return data;
  },

  async listAll(params = {}) {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  async accept(id) {
    const { data } = await api.patch(`/orders/${id}/accept`);
    return data;
  },

  async reject(id) {
    const { data } = await api.patch(`/orders/${id}/reject`);
    return data;
  },

  async cancelByCustomer(id) {
    const { data } = await api.patch(`/orders/${id}/cancel`);
    return data;
  },

  async cancelByCompany(id) {
    const { data } = await api.patch(`/orders/${id}/cancel-by-company`);
    return data;
  },

  async confirmReceived(id) {
    const { data } = await api.patch(`/orders/${id}/confirm-received`);
    return data;
  },

  async updateStatus(id, status, confirmationCode = null) {
    const payload = { status };
    if (confirmationCode) {
      payload.confirmation_code = confirmationCode;
    }
    const { data } = await api.patch(`/orders/${id}/status`, payload);
    return data;
  },
};
