import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every request automatically, read fresh from
// localStorage each time (not captured once at module load) so a
// just-logged-in user doesn't need a page refresh for it to kick in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, bounce back to login rather than
// leaving the UI stuck on a silent 401.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((res) => res.data);

export const getCurrentUser = () =>
  api.get('/auth/me').then((res) => res.data);

// ---------- Dashboard ----------
export const getDashboardStats = () =>
  api.get('/dashboard/stats').then((res) => res.data);

// ---------- Invoices ----------
export const getInvoices = (params) =>
  api.get('/invoices', { params }).then((res) => res.data);

export const getInvoiceById = (id) =>
  api.get(`/invoices/${id}`).then((res) => res.data);

export const createInvoice = (payload) =>
  api.post('/invoices', payload).then((res) => res.data);

export const updateInvoiceStatus = (id, status) =>
  api.patch(`/invoices/${id}/status`, { status }).then((res) => res.data);

export const bulkDeleteInvoices = (ids) =>
  api.post('/invoices/bulk-delete', { ids }).then((res) => res.data);

// ---------- Customers ----------
export const getCustomers = () =>
  api.get('/customers').then((res) => res.data);

// CSV export returns a raw file, so it bypasses the JSON `.data` shortcut
// and is handled by the caller (triggers a browser download).
export const exportInvoicesCsv = (params) =>
  api.get('/invoices/export', { params, responseType: 'blob' });

export default api;