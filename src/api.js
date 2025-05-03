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
  // Assuming backend returns { produtos: [...] } or { success: true, produtos: [...] }
  return data.produtos || (data.success && data.produtos) || []; 
};

// Use the correct backend endpoint path: /produtos/
export const createProduct = async (product) => {
  const url = `${BASE_URL}/produtos/`;
  console.log("[API DEBUG] Attempting to create product at:", url);
  console.log("[API DEBUG] Payload:", product);
  try {
    const res = await fetch(url, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    console.log(`[API DEBUG] Create product response status: ${res.status} ${res.statusText}`);
    
    // Add check for response status before parsing JSON
    if (!res.ok) {
      let errorBody = "No error body available";
      try {
        errorBody = await res.text(); // Get raw text first
        console.error(`[API DEBUG] Create product error body: ${errorBody}`);
        // Try parsing as JSON if possible
        const errorData = JSON.parse(errorBody);
        throw new Error(errorData.error || `Failed to create product: ${res.status} - ${errorBody}`);
      } catch (parseOrTextError) {
         // If parsing fails or reading text fails, use the status and original text
         console.error("[API DEBUG] Failed to parse error body or read text:", parseOrTextError);
         throw new Error(`Failed to create product: ${res.status} ${res.statusText}. Response: ${errorBody}`);
      }
    }
    // If response is OK, parse JSON
    const data = await res.json();
    console.log("[API DEBUG] Create product success response data:", data);
    return data;
  } catch (error) {
    // Catch network errors (like Failed to Fetch) or errors thrown above
    console.error("[API DEBUG] Error during createProduct fetch:", error);
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        // Specific network error
        throw new Error("Erro de rede ao tentar criar produto. Verifique a conexão com o servidor ou a configuração CORS do backend.");
    } else {
        // Other errors (parsing, backend error messages, etc.)
        throw error; // Re-throw the original error
    }
  }
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
  return data.opcoes || []; // Assuming backend returns { sucesso: true, opcoes: [...] }
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
  // The backend uses /fornecedores/ but the blueprint might be registered under /suppliers/
  // Let's try /fornecedores/ first as seen in supplier_routes.py
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

    // *** FIX: Handle the actual backend response structure ***
    if (data && data.success && Array.isArray(data.fornecedores)) { 
      console.log("[API DEBUG] Supplier data found in data.fornecedores.");
      return data.fornecedores;
    } else if (Array.isArray(data)) { // Keep handling direct array just in case
      console.log("[API DEBUG] Supplier data is direct array.");
      return data;
    } else {
      console.warn("[API DEBUG] Unexpected response format from /fornecedores/ endpoint:", data);
      // Check if there was an error message in the response
      if (data && !data.success && data.error) {
          throw new Error(`Backend error fetching suppliers: ${data.error}`);
      }
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

