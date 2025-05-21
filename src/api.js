// src/api.js

/**
 * Centralized fetch that adds Authorization header and JSON handling
 */
const BASE_URL = (import.meta.env.VITE_API_URL || 'https://tutto-baby-backend.onrender.com')
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

export const fetchProducts = () => authFetch('/produtos/', { method: 'GET' });
export const createProduct = (p) =>
  authFetch('/produtos/', { method: 'POST', body: JSON.stringify(p) });
export const fetchFieldOptions = (type) =>
  authFetch(`/opcoes_campo/${type}?incluir_inativos=false`, { method: 'GET' });
export default authFetch;
