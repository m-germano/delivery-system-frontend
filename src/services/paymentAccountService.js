import { api } from './api.js';

export const paymentAccountService = {
  async getMercadoPagoConnectUrl(companyId) {
    const { data } = await api.get(`/companies/${companyId}/payment-accounts/mercado-pago/connect-url`);
    return data;
  },

  async listCompanyPaymentAccounts(companyId) {
    const { data } = await api.get(`/companies/${companyId}/payment-accounts`);
    return data;
  },

  async disconnectCompanyPaymentAccount(companyId, accountId) {
    const { data } = await api.delete(`/companies/${companyId}/payment-accounts/${accountId}`);
    return data;
  },
};
