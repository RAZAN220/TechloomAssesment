import api from './api';

export const listOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data.data; // { orders, pagination }
};

// @returns { order, payments, refunds }
export const getOrder = async (orderId) => {
  const { data } = await api.get(`/orders/${orderId}`);
  return data.data;
};

// @returns { order, refund|null } — Reserved: stock released; Paid: auto-refund
export const cancelOrder = async (orderId, reason) => {
  const { data } = await api.post(`/orders/${orderId}/cancel`, reason ? { reason } : {});
  return data.data;
};

export const requestRefund = async (orderId) => {
  const { data } = await api.post('/refunds', { orderId });
  return data.data; // { refund, replayed }
};
