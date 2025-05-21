// src/api.js

/**
 * Centralized fetch that adds Authorization header and JSON handling
 */
const BASE_URL = (process.env.REACT_APP_API_URL || 'https://tutto-baby-backend.onrender.com')
  .replace(/\/$/, '');

async function authFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}/api${path}`, {
    credentials: 'omit',
    ...options,
    headers,
  });
  if (res.status === 401) {
    // Unauthenticated → force logout
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : {};
}

// Named export for direct fetch calls
export const apiFetch = authFetch;

// Products endpoints
export const fetchProducts = () => authFetch('/produtos/', { method: 'GET' });
export const createProduct = (product) =>
  authFetch('/produtos/', { method: 'POST', body: JSON.stringify(product) });

// Field options (for admin field manager)
export const fetchFieldOptions = (type) =>
  authFetch(`/opcoes_campo/${type}?incluir_inativos=false`, { method: 'GET' });

// Suppliers (used in ProductForm)
export const fetchSuppliers = () =>
  authFetch('/fornecedores/', { method: 'GET' });

// Summary & Alerts
export const fetchSummary = () => authFetch('/summary', { method: 'GET' });
export const fetchLowStock = () => authFetch('/alerts/low-stock', { method: 'GET' });

// Transactions (sales & stock movements)
export const createTransaction = (tx) =>
  authFetch('/transactions/', { method: 'POST', body: JSON.stringify(tx) });

// Default export for convenience
export default authFetch;
