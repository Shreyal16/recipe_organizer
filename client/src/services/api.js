import axios from 'axios';

/**
 * Centralized Axios instance.
 * Uses baseURL: '/api' which is forwarded to the backend via Vite proxy in development.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    let details = null;

    if (error.response) {
      // Backend returned standard error envelope
      if (error.response.data && error.response.data.error) {
        message = error.response.data.error.message || message;
        details = error.response.data.error.details || null;
      } else if (error.response.status === 404) {
        message = 'Requested resource not found.';
      } else if (error.response.status === 500) {
        message = 'Server encountered an internal error. Please try again later.';
      }
      return Promise.reject({
        status: error.response.status,
        message,
        details,
        isAxiosError: true,
      });
    } else if (error.request) {
      // Network failure
      message = 'Unable to reach the server. Please verify your connection or backend status.';
      return Promise.reject({
        status: 0,
        message,
        details: null,
        isNetworkError: true,
      });
    }

    return Promise.reject({
      status: -1,
      message: error.message || message,
      details: null,
    });
  }
);

export default api;
