import api from './api';

/**
 * Product discovery + admin management.
 * Prices cross the API as cents; list filters accept dollars (min/maxPrice).
 */
export const listProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data.data; // { products, pagination }
};

export const getCategories = async () => {
  const { data } = await api.get('/products/categories');
  return data.data.categories;
};

export const getProduct = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.data.product;
};

// ---- Admin ----
export const createProduct = async (payload) => {
  const { data } = await api.post('/products', payload);
  return data.data.product;
};

export const updateProduct = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data.data.product;
};

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};
