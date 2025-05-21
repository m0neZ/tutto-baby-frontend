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
    credentials: "omit", // because we send the header manually
    ...options,
    headers,
  });

  if (res.status === 401) {
    // unauthorized → clear tokens + redirect
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Não autorizado");
  }

  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {}
    throw new Error(`Erro ${res.status}: ${text || res.statusText}`);
  }

  // parse JSON or return empty object
  const txt = await res.text();
  return txt ? JSON.parse(txt) : {};
}

// --- Products ---

export const fetchProducts = async () => {
  const data = await apiFetch("/produtos/", { method: "GET" });
  return data.produtos || [];
};

export const createProduct = async (product) => {
  const data = await apiFetch("/produtos/", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return data;
};

// --- Field Options (admin fields manager) ---

export const fetchFieldOptions = async (fieldType) => {
  const data = await apiFetch(`/opcoes_campo/${fieldType}?incluir_inativos=false`, {
    method: "GET",
  });
  return data.opcoes || [];
};

// --- Summary & Alerts ---

export const fetchSummary = async () => {
  const data = await apiFetch("/summary", { method: "GET" });
  return data.summary;
};

export const fetchLowStock = async () => {
  const data = await apiFetch("/alerts/low-stock", { method: "GET" });
  return data.products;
};

// --- Suppliers ---

export const fetchSuppliers = async () => {
  const data = await apiFetch("/fornecedores/", { method: "GET" });
  if (data.fornecedores) return data.fornecedores;
  return Array.isArray(data) ? data : [];
};

// --- Transactions (Sales & Stock movements) ---

export const createTransaction = async (transaction) => {
  const data = await apiFetch("/transactions/", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
  return data;
};
