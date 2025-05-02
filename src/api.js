const BASE_URL = 
  `${(import.meta.env?.VITE_API_URL || "https://tutto-baby-backend.onrender.com").replace(/\/$/, 
    "")}/api`;

// Use the correct backend endpoint path: /produtos/
export const fetchProducts = async () => {
  const res = await fetch(`${BASE_URL}/produtos/`); // Changed from /products/
  if (!res.ok) {
    // Add basic error handling
    throw new Error(`Failed to fetch products: ${res.status}`);
  }
  const data = await res.json();
  return data.produtos; // Assuming backend returns { produtos: [...] }
};

// Use the correct backend endpoint path: /produtos/
export const createProduct = async (product) => {
  const res = await fetch(`${BASE_URL}/produtos/`, { // Changed from /products/
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  // Add check for response status before parsing JSON
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})); // Try to get error details
    throw new Error(errorData.error || `Failed to create product: ${res.status}`);
  }
  return await res.json();
};

// Function to fetch options for a specific field type
export const fetchFieldOptions = async (fieldType) => {
  // Fetch only active options by default
  const res = await fetch(`${BASE_URL}/opcoes_campo/${fieldType}?incluir_inativos=false`);
  if (!res.ok) {
    throw new Error(`Failed to fetch options for ${fieldType}: ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || `API error fetching options for ${fieldType}`);
  }
  return data.opcoes; // Assuming backend returns { sucesso: true, opcoes: [...] }
};


// Keep other functions as they are, assuming their endpoints are correct
// Verify these endpoints if issues arise with summary, alerts, suppliers, transactions

export const fetchSummary = async () => {
  const res = await fetch(`${BASE_URL}/summary`);
  const data = await res.json();
  return data.summary;
};

export const fetchLowStock = async () => {
  const res = await fetch(`${BASE_URL}/alerts/low-stock`);
  const data = await res.json();
  return data.products;
};

// Use the correct Portuguese endpoint: /fornecedores/
export const fetchSuppliers = async () => {
  const res = await fetch(`${BASE_URL}/fornecedores/`); // Changed from /suppliers/
  if (!res.ok) {
    throw new Error(`Failed to fetch suppliers: ${res.status}`);
  }
  const data = await res.json();
  // Assuming the backend returns { fornecedores: [...] }
  if (data && Array.isArray(data.fornecedores)) {
      return data.fornecedores;
  } else {
      console.warn("Unexpected response format from /fornecedores/ endpoint:", data);
      return []; // Return empty array on unexpected format
  }
};

export const createTransaction = async (transaction) => {
  const res = await fetch(`${BASE_URL}/transactions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  });
  return await res.json();
};
