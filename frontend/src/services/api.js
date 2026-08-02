import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  regenerateApiKey: () => api.post('/auth/api-key/regenerate'),
};

export const urlAPI = {
  create: (data) => api.post('/urls', data),
  getMyUrls: () => api.get('/urls/my-urls'),
  toggleActive: (id) => api.patch(`/urls/${id}/toggle-active`),
  deleteUrl: (id) => api.delete(`/urls/${id}`),
};

export const analyticsAPI = {
  getDashboardSummary: () => api.get('/analytics/dashboard-summary'),
  getUrlAnalytics: (id) => api.get(`/analytics/url/${id}`),
};

export default api;
