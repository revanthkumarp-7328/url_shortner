import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Local dev server
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5002';
    }
    
    // Direct EC2 IP address access
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `http://${hostname}:5002`;
    }

    // Same-origin production domain access (eliminates cross-domain CORS)
    if (hostname === 'zipurl.dpdns.org') {
      return window.location.origin;
    }
  }
  
  // Production Domain API endpoint fallback
  return 'https://api.zipurl.dpdns.org';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const urlAPI = {
  create: (data) => api.post('/', data),
  getAllUrls: () => api.get('/all'),
  updateUrl: (id, data) => api.put(`/${id}`, data),
  toggleActive: (id) => api.patch(`/${id}/toggle-active`),
  deleteUrl: (id) => api.delete(`/${id}`),
};

export default api;
