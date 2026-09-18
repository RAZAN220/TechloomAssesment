import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

let cartCreationRequest = null;

export function clearStoredCartId() {
  localStorage.removeItem('cartId');
}

export async function getCartId() {
  const savedCartId = localStorage.getItem('cartId');
  if (savedCartId) return savedCartId;

  if (!cartCreationRequest) {
    cartCreationRequest = api
      .post('/carts')
      .then((response) => {
        const cartId = response.data?.data?.cartId;
        if (!cartId) throw new Error('Cart ID was not returned');
        localStorage.setItem('cartId', cartId);
        return cartId;
      })
      .finally(() => {
        cartCreationRequest = null;
      });
  }

  return cartCreationRequest;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    return Promise.reject(normalizedError);
  }
);

// Runs a cart request against the stored cart. If the server reports the cart
// is gone (404 "Cart not found"), the stale id is discarded, a fresh cart is
// created, and the request is retried once against the new cart. Resolves
// with { cartId, response } so callers always know which cart was used.
export async function withCartRecovery(requestFn) {
  let cartId = await getCartId();
  try {
    return { cartId, response: await requestFn(cartId) };
  } catch (error) {
    if (error?.status !== 404) throw error;
    clearStoredCartId();
    cartId = await getCartId();
    return { cartId, response: await requestFn(cartId) };
  }
}

export async function addCartItem(payload) {
  const { response } = await withCartRecovery((cartId) => api.post(`/carts/${cartId}/items`, payload));
  return response;
}

export default api;
