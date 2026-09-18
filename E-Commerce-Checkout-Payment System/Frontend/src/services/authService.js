import api from './api';

const TOKEN_KEY = 'techmart_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// @returns { user, token }
export const registerUser = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  setToken(data.data.token);
  return data.data;
};

// @returns { user, token }
export const loginUser = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  setToken(data.data.token);
  return data.data;
};

// @returns user
export const fetchMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.data.user;
};

export const logoutUser = () => clearToken();
