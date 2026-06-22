import { api } from './api.js';

export const addressService = {
  async lookupZipCode(zipCode) {
    const { data } = await api.get(`/address/zip-code/${zipCode}`);
    return data;
  },

  async geocode(payload) {
    const { data } = await api.post('/address/geocode', payload);
    return data;
  },

  async resolve(payload) {
    const { data } = await api.post('/address/resolve', payload);
    return data;
  },
};
