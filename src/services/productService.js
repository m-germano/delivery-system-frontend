import { api } from './api.js';

export const productService = {
  async list(params = {}) {
    const { data } = await api.get('/products', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/products', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/products/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  async listMyCategories() {
    const { data } = await api.get('/product-categories/me');
    return data;
  },

  async createCategory(payload) {
    const { data } = await api.post('/product-categories', payload);
    return data;
  },

  async updateCategory(id, payload) {
    const { data } = await api.put(`/product-categories/${id}`, payload);
    return data;
  },

  async removeCategory(id) {
    const { data } = await api.delete(`/product-categories/${id}`);
    return data;
  },
};
