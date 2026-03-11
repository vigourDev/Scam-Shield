import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
};

// Check identifier
export const checkAPI = {
  check: (type, value) =>
    api.post('/check', { type, value }),
  getReports: (value, type) =>
    api.get(`/reports/${value}`, { params: { type } }),
};

// Reports
export const reportAPI = {
  submit: (reportData) =>
    api.post('/report', reportData),
  getTrending: (days = 30) =>
    api.get('/trending', { params: { days } }),
  getUserReports: () =>
    api.get('/my-reports'),
};

// Admin endpoints
export const adminAPI = {
  approveReport: (reportId) =>
    api.post(`/admin/reports/${reportId}/approve`, {}),
  rejectReport: (reportId, reason) =>
    api.post(`/admin/reports/${reportId}/reject`, { reason }),
  blacklistIdentifier: (identifierId, reason) =>
    api.post(`/admin/identifiers/${identifierId}/blacklist`, { reason }),
  banUser: (userId) =>
    api.post(`/admin/users/${userId}/ban`, {}),
  unbanUser: (userId) =>
    api.post(`/admin/users/${userId}/unban`, {}),
  getStats: () =>
    api.get('/admin/stats'),
};

export default api;
