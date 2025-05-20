// src/api.js

const BASE_URL = `${(import.meta.env?.VITE_API_URL || "https://tutto-baby-backend.onrender.com")
  .replace(/\/$/, "")}/api`;

/**
 * Helper to perform authenticated fetches.
 */
async function authFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "omit", // we’re sending auth header manually
    ...options,
    headers
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

  // OK
  // Some endpoints return no JSON body
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// --- Products ---

export const fetchProducts = async () => {
  const data = await authFetch("/produtos/", { method: "GET" });
  return data.produtos || [];
};

export const createProduct = async (product) => {
  console.debug("[API] createProduct payload:", product);
  const data = await authFetch("/produtos/", {
    method: "POST",
    body: JSON.stringify(product)
  });
  return data;
};

// --- Field Options (admin fields manager) ---

export const fetchFieldOptions = async (fieldType) => {
  const data = await authFetch(
    `/opcoes_campo/${fieldType}?incluir_inativos=false`,
    { method: "GET" }
  );
  return data.opcoes || [];
};

// --- Summary & Alerts ---

export const fetchSummary = async () => {
  const data = await authFetch("/summary", { method: "GET" });
  return data.summary;
};

export const fetchLowStock = async () => {
  const data = await authFetch("/alerts/low-stock", { method: "GET" });
  return data.products;
};

// --- Suppliers ---

export const fetchSuppliers = async () => {
  console.debug("[API] fetching suppliers");
  const data = await authFetch("/fornecedores/", { method: "GET" });
  // Handle both { success, fornecedores: [...] } and direct array
  if (data.fornecedores) return data.fornecedores;
  if (Array.isArray(data)) return data;
  return [];
};

// --- Transactions (Sales & Stock movements) ---

export const createTransaction = async (transaction) => {
  const data = await authFetch("/transactions/", {
    method: "POST",
    body: JSON.stringify(transaction)
  });
  return data;
};
