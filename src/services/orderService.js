import { api } from './api.js';

function isMissingCheckoutProRoute(error) {
  const status = error?.response?.status;
  return status === 404 || status === 405;
}

function getCheckoutUrl(data) {
  if (!data) return null;

  const payment = data.payment ?? {};
  const rawResponse = data.raw_response ?? payment.raw_response ?? {};

  return (
    data.checkout_url ??
    data.checkoutUrl ??
    data.init_point ??
    data.sandbox_init_point ??
    data.payment_url ??
    payment.checkout_url ??
    payment.checkoutUrl ??
    payment.init_point ??
    payment.sandbox_init_point ??
    payment.payment_url ??
    rawResponse.init_point ??
    rawResponse.sandbox_init_point ??
    null
  );
}

function getCheckoutPreferenceId(data) {
  if (!data) return null;

  const payment = data.payment ?? {};
  const rawResponse = data.raw_response ?? payment.raw_response ?? {};

  return (
    data.checkout_preference_id ??
    data.preference_id ??
    data.provider_order_id ??
    payment.checkout_preference_id ??
    payment.preference_id ??
    payment.provider_order_id ??
    rawResponse.id ??
    rawResponse.preference_id ??
    null
  );
}

function normalizeOnlinePaymentResponse(data) {
  if (!data) return data;

  const checkoutUrl = getCheckoutUrl(data);
  const checkoutPreferenceId = getCheckoutPreferenceId(data);

  const normalizedPayment = data.payment
    ? {
      ...data.payment,
      checkout_url: data.payment.checkout_url ?? checkoutUrl,
      checkoutUrl: data.payment.checkoutUrl ?? checkoutUrl,
      init_point: data.payment.init_point ?? checkoutUrl,
      checkout_preference_id: data.payment.checkout_preference_id ?? checkoutPreferenceId,
      preference_id: data.payment.preference_id ?? checkoutPreferenceId,
    }
    : data.payment;

  return {
    ...data,
    payment: normalizedPayment,
    checkout_url: data.checkout_url ?? checkoutUrl,
    checkoutUrl: data.checkoutUrl ?? checkoutUrl,
    init_point: data.init_point ?? checkoutUrl,
    checkout_preference_id: data.checkout_preference_id ?? checkoutPreferenceId,
    preference_id: data.preference_id ?? checkoutPreferenceId,
    payment_status: data.payment_status ?? data.payment?.status ?? null,
  };
}

export const orderService = {
  async calculate(payload) {
    const { data } = await api.post('/orders/calculate', payload);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/orders', payload);
    return data;
  },

  async createCheckoutPro(payload) {
    const checkoutPayload = {
      ...payload,
      payment_method: 'PIX_ONLINE',
    };

    try {
      const { data } = await api.post('/orders/checkout-pro', checkoutPayload);
      return normalizeOnlinePaymentResponse(data);
    } catch (error) {
      if (!isMissingCheckoutProRoute(error)) {
        throw error;
      }

      const { data } = await api.post('/orders/pix', checkoutPayload);
      return normalizeOnlinePaymentResponse(data);
    }
  },

  async createPix(payload) {
    return this.createCheckoutPro(payload);
  },

  async getCompanyPaymentAvailability(companyId) {
    const { data } = await api.get(`/companies/${companyId}/payment-availability`);
    return data;
  },

  async getPaymentStatus(id) {
    const { data } = await api.get(`/orders/${id}/payment-status`);
    return normalizeOnlinePaymentResponse(data);
  },

  async cancelCheckoutProPayment(id) {
    try {
      const { data } = await api.post(`/orders/${id}/payments/checkout-pro/cancel`);
      return normalizeOnlinePaymentResponse(data);
    } catch (error) {
      if (!isMissingCheckoutProRoute(error)) {
        throw error;
      }

      const { data } = await api.post(`/orders/${id}/payments/pix/cancel`);
      return normalizeOnlinePaymentResponse(data);
    }
  },

  async cancelPixPayment(id) {
    return this.cancelCheckoutProPayment(id);
  },

  async regenerateCheckoutProPayment(id) {
    try {
      const { data } = await api.post(`/orders/${id}/payments/checkout-pro/regenerate`);
      return normalizeOnlinePaymentResponse(data);
    } catch (error) {
      if (!isMissingCheckoutProRoute(error)) {
        throw error;
      }

      const { data } = await api.post(`/orders/${id}/payments/pix/regenerate`);
      return normalizeOnlinePaymentResponse(data);
    }
  },

  async regeneratePixPayment(id) {
    return this.regenerateCheckoutProPayment(id);
  },

  async regenerateOnlinePayment(id) {
    return this.regenerateCheckoutProPayment(id);
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