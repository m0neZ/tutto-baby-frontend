// src/api.js
// 🔧 Use CRA env var here as well
const BASE_URL = `${(process.env.REACT_APP_API_URL || "https://tutto-baby-backend.onrender.com")
  .replace(/\/$/, "")}/api`;

/**
 * Helper to perform authenticated fetches.
 */
async function authFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "omit", // sending header manually
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Não autorizado");
  }

  if (!res.ok) {
    let errText = "";
    try { errText = await res.text(); } catch {}
    throw new Error(`Erro ${res.status}: ${errText || res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const fetchProducts = async () => {
  const data = await authFetch("/produtos/", { method: "GET" });
  return Array.isArray(data.produtos) ? data.produtos : [];
};

export const createProduct = async (product) =>
  await authFetch("/produtos/", {
    method: "POST",
    body: JSON.stringify(product),
  });

export const fetchFieldOptions = async (fieldType) => {
  const data = await authFetch(
    `/opcoes_campo/${fieldType}?incluir_inativos=false`,
    { method: "GET" }
  );
  return Array.isArray(data.opcoes) ? data.opcoes : [];
};

export const fetchSummary = async () => {
  const data = await authFetch("/summary", { method: "GET" });
  return data.summary;
};

export const fetchLowStock = async () => {
  const data = await authFetch("/alerts/low-stock", { method: "GET" });
  return data.products;
};

export const fetchSuppliers = async () => {
  const data = await authFetch("/fornecedores/", { method: "GET" });
  if (Array.isArray(data.fornecedores)) return data.fornecedores;
  if (Array.isArray(data)) return data;
  return [];
};

export const createTransaction = async (transaction) =>
  await authFetch("/transactions/", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
