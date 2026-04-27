/**
 * API Client Service
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Allow callers to pass `_silent: true` to skip global error toasts
interface SilentConfig extends InternalAxiosRequestConfig {
  _silent?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    // Skip global toasts for requests marked as silent
    if ((error.config as SilentConfig)?._silent) return Promise.reject(error);

    // Handle specific error codes
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { error?: string; message?: string };

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          break;

        case 403:
          toast.error('You do not have permission to perform this action.');
          break;

        case 404:
          toast.error('Resource not found.');
          break;

        case 500:
          toast.error('Server error. Please try again later.');
          break;

        default:
          toast.error(data.error || data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Error in request configuration
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
