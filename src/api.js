// src/api.js

const BASE_URL = `${(import.meta.env?.VITE_API_URL || "https://tutto-baby-backend.onrender.com")
  .replace(/\/$/, "")}/api`;

/**
 * apiFetch wraps fetch to:
 *  - attach the JWT from localStorage
 *  - handle 401 by clearing tokens + redirecting to /login
 *  - throw on other non-OK statuses (with status code in message)
 *  - parse JSON (or return empty object if no body)
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "omit", // we’re sending auth header manually
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Unauthorized: drop token and force login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Não autorizado");
  }

  if (!res.ok) {
    // Try to get error message from body
    let errText = "";
    try {
      errText = await res.text();
    } catch {}
    throw new Error(`Erro ${res.status}: ${errText || res.statusText}`);
  }

  // OK – parse JSON if present
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// Convenience wrappers for your endpoints

export const fetchProducts = () =>
  apiFetch("/produtos/", { method: "GET" }).then((d) => d.produtos || []);

export const createProduct = (product) =>
  apiFetch("/produtos/", {
    method: "POST",
    body: JSON.stringify(product),
  });

export const fetchFieldOptions = (fieldType) =>
  apiFetch(`/opcoes_campo/${fieldType}?incluir_inativos=false`, {
    method: "GET",
  }).then((d) => d.opcoes || []);

export const fetchSummary = () =>
  apiFetch("/summary", { method: "GET" }).then((d) => d.summary);

export const fetchLowStock = () =>
  apiFetch("/alerts/low-stock", { method: "GET" }).then((d) => d.products);

export const fetchSuppliers = () =>
  apiFetch("/fornecedores/", { method: "GET" }).then((d) => {
    // Handle both { fornecedores: [...] } and direct array
    if (d.fornecedores) return d.fornecedores;
    return Array.isArray(d) ? d : [];
  });

export const createTransaction = (transaction) =>
  apiFetch("/transactions/", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
