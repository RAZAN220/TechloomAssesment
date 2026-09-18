import axios from 'axios';
import { getToken } from './authService';

/**
 * Axios instance for the backend REST API.
 * - Attaches the JWT bearer token automatically.
 * - Normalizes all errors into Error objects with { status, errors }.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    const normalized = new Error(
      (response && response.data && response.data.message) ||
        'Network error — please check your connection and try again'
    );
    normalized.status = response ? response.status : 0;
    normalized.errors = response && response.data ? response.data.errors : undefined;
    return Promise.reject(normalized);
  }
);

export default api;
