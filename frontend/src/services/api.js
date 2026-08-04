import axios from 'axios';

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL = isLocal 
  ? 'http://localhost:5002' 
  : 'https://api.zipurl.dpdns.org';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const urlAPI = {
  create: (data) => api.post('/', data),
  getAllUrls: () => api.get('/all'),
  toggleActive: (id) => api.patch(`/${id}/toggle-active`),
  deleteUrl: (id) => api.delete(`/${id}`),
};

export default api;
