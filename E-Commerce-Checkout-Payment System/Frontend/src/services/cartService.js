import api from './api';

export const getCart = async () => {
  const { data } = await api.get('/cart');
  return data.data.cart; // { items, total, itemCount, hasIssues }
};

export const addToCart = async (productId, qty = 1) => {
  const { data } = await api.post('/cart/items', { productId, qty });
  return data.data.cart;
};

// qty 0 removes the item
export const updateCartItem = async (productId, qty) => {
  const { data } = await api.put(`/cart/items/${productId}`, { qty });
  return data.data.cart;
};

export const removeCartItem = async (productId) => {
  const { data } = await api.delete(`/cart/items/${productId}`);
  return data.data.cart;
};

export const clearCart = async () => {
  const { data } = await api.delete('/cart');
  return data.data.cart;
};
