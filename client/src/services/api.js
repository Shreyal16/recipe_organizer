import axios from 'axios';

/**
 * Centralized Axios instance.
 * Production uses VITE_API_URL pointing to Render backend (e.g. https://recipe-organizer-api.onrender.com/api).
 * Development falls back to '/api' for Vite dev proxy.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds to tolerate Render free-tier cold starts
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    let details = null;

    if (error.response) {
      if (error.response.data && error.response.data.error) {
        message = error.response.data.error.message || message;
        details = error.response.data.error.details || null;
      } else if (error.response.status === 404) {
        message = 'Requested resource not found.';
      } else if (error.response.status === 500) {
        message = 'Server encountered an internal error. Please try again later.';
      } else if (error.response.status === 503) {
        message = 'Service temporarily unavailable. Database connection initializing.';
      }
      return Promise.reject({
        status: error.response.status,
        message,
        details,
        isAxiosError: true,
      });
    } else if (error.request) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message = 'The server is currently waking up from sleep. Please wait a moment and refresh.';
      } else {
        message = 'Unable to reach the server. Please verify your connection or backend status.';
      }
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
