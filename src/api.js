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

export const fetchSuppliers = async () => {
  const res = await fetch(`${BASE_URL}/suppliers/`);
  const data = await res.json();
  return data.suppliers;
};

export const createTransaction = async (transaction) => {
  const res = await fetch(`${BASE_URL}/transactions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  });
  return await res.json();
};

