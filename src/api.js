const BASE_URL = 'https://tutto-baby-backend.onrender.com';

export const fetchProducts = async () => {
  const res = await fetch(`${BASE_URL}/products/`);
  const data = await res.json();
  return data.products;
};

export const createProduct = async (product) => {
  const res = await fetch(`${BASE_URL}/products/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return await res.json();
};

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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });
  return await res.json();
};
