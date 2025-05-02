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
// Make response handling more robust
export const fetchSuppliers = async () => {
  const url = `${BASE_URL}/fornecedores/`;
  console.log(`[API DEBUG] Fetching suppliers from: ${url}`); // Add logging
  try {
    const res = await fetch(url);
    console.log(`[API DEBUG] Supplier fetch response status: ${res.status} ${res.statusText}`); // Log status
    if (!res.ok) {
      let errorBody = "No error body available";
      try {
        errorBody = await res.text(); // Get raw text in case JSON parsing fails
        console.error(`[API DEBUG] Supplier fetch error body: ${errorBody}`);
      } catch (textError) {
        console.error("[API DEBUG] Failed to read error body text.");
      }
      throw new Error(`Failed to fetch suppliers: ${res.status} - ${errorBody}`);
    }
    
    // Get raw text first to ensure it's not empty or malformed
    const rawText = await res.text();
    console.log(`[API DEBUG] Supplier fetch raw response text: ${rawText}`);
    
    if (!rawText) {
        console.warn("[API DEBUG] Received empty response from /fornecedores/");
        return []; // Return empty if response is empty
    }

    let data;
    try {
        data = JSON.parse(rawText); // Parse the raw text
    } catch (parseError) {
        console.error("[API DEBUG] Failed to parse supplier JSON:", parseError);
        console.error("[API DEBUG] Raw text was:", rawText);
        throw new Error(`Failed to parse supplier response: ${parseError.message}`);
    }
    
    console.log("[API DEBUG] Parsed supplier data:", data); // Log parsed data

    // Handle different possible structures
    if (Array.isArray(data)) { // Case 1: Backend returns just the array [...]
      console.log("[API DEBUG] Supplier data is direct array.");
      return data;
    } else if (data && Array.isArray(data.fornecedores)) { // Case 2: Backend returns { fornecedores: [...] }
      console.log("[API DEBUG] Supplier data is in data.fornecedores.");
      return data.fornecedores;
    } else if (data && Array.isArray(data.data)) { // Case 3: Backend returns { success: true, data: [...] } or similar
      console.log("[API DEBUG] Supplier data is in data.data.");
      return data.data;
    } else {
      console.warn("[API DEBUG] Unexpected response format from /fornecedores/ endpoint:", data);
      return []; // Return empty array on unexpected format
    }
  } catch (error) {
      console.error("[API DEBUG] Error during fetchSuppliers execution:", error);
      throw error; // Re-throw the error to be caught by the calling component
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
