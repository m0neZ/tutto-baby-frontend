import React, { useEffect, useState, useMemo, forwardRef } from "react";
import {
  createProduct,
  fetchSuppliers,
  fetchProducts,
  fetchFieldOptions,
} from "./api";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import FormHelperText from "@mui/material/FormHelperText";
import CurrencyInput from "react-currency-input-field";
import InputAdornment from "@mui/material/InputAdornment";

// Adapter component to bridge CurrencyInput with MUI TextField
const CurrencyInputAdapter = forwardRef(function CurrencyInputAdapter(
  props,
  ref
) {
  const { onChange, ...other } = props;

  return (
    <CurrencyInput
      {...other}
      ref={ref}
      onValueChange={(value, name, values) => {
        // Pass the raw value string to the onChange handler
        onChange({
          target: {
            name: props.name,
            value: value === undefined || value === null ? "" : String(value),
          },
        });
      }}
      allowNegativeValue={false}
      decimalSeparator=","
      groupSeparator="."
      decimalsLimit={2}
      prefix=""
    />
  );
});

const ProductForm = ({ onProductAdded }) => {
  const initialFormData = {
    name: "",
    gender: "",
    size: "",
    colorPrint: "",
    supplierId: "",
    cost: "",
    retailPrice: "",
    quantity: "",
    purchaseDate: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [supplierError, setSupplierError] = useState(""); // Specific error for supplier loading

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    const loadInitialData = async () => {
      console.log("[FORM DEBUG] Starting loadInitialData...");
      if (!isMounted) return;
      setLoading(true);
      setFormError("");
      setSupplierError("");

      try {
        console.log("[FORM DEBUG] Fetching suppliers...");
        const supplierList = await fetchSuppliers();
        console.log("[FORM DEBUG] Raw Fetched Suppliers in Form:", supplierList);
        if (isMounted) {
          if (Array.isArray(supplierList) && supplierList.length > 0) {
            setSuppliers(supplierList);
            console.log("[FORM DEBUG] Suppliers state updated with:", supplierList);
          } else {
            setSuppliers([]);
            // Check if it was an empty array or actual error before setting message
            if (!supplierList) { // Check if supplierList is null/undefined (likely fetch error)
                setSupplierError("Erro ao carregar fornecedores.");
            } else { // It was an empty array
                setSupplierError("Nenhum fornecedor ativo encontrado.");
            }
            console.warn("[FORM DEBUG] No suppliers found or invalid format.");
          }
        }

        console.log("[FORM DEBUG] Fetching products, sizes, colors...");
        const [productList, sizeOpts, colorOpts] = await Promise.all([
          fetchProducts(),
          fetchFieldOptions("tamanho"),
          fetchFieldOptions("cor_estampa"),
        ]);
        console.log("[FORM DEBUG] Fetched products, sizes, colors.");
        if (isMounted) {
          setProducts(productList || []);
          setSizeOptions(sizeOpts || []);
          setColorOptions(colorOpts || []);
          console.log("[FORM DEBUG] Products, sizes, colors state updated.");
        }
      } catch (err) {
        console.error("[FORM DEBUG] Error loading initial form data:", err);
        if (isMounted) {
          setFormError(
            `Erro ao carregar dados: ${err.message}. Verifique a conexão com o backend.`
          );
          // If the error specifically mentions suppliers, update supplierError
          if (err.message.toLowerCase().includes("suppliers") || err.message.toLowerCase().includes("fornecedores")) {
            setSupplierError(`Erro ao carregar fornecedores: ${err.message}`);
            setSuppliers([]); // Ensure suppliers is empty on error
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("[FORM DEBUG] loadInitialData finished.");
        }
      }
    };

    loadInitialData();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log("[FORM DEBUG] ProductForm unmounted or dependency changed.");
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Specific handler for Autocomplete changes
  const handleAutocompleteChange = (event, newValue) => {
    const nameValue =
      typeof newValue === "string" ? newValue : newValue?.label || "";
    setFormData((prev) => ({ ...prev, name: nameValue }));
  };

  const handleAutocompleteInputChange = (event, newInputValue) => {
    setFormData((prev) => ({ ...prev, name: newInputValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setLoading(true);

    // --- Validation --- 
    const requiredFields = {
      name: "Nome",
      gender: "Sexo",
      size: "Tamanho",
      colorPrint: "Cor/Estampa",
      supplierId: "Fornecedor",
      cost: "Custo",
      retailPrice: "Preço Venda",
      quantity: "Quantidade",
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key] || String(formData[key]).trim() === "")
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      setFormError(`Campos obrigatórios faltando: ${missingFields.join(", ")}.`);
      setLoading(false);
      return;
    }

    // Convert currency strings (like "123,45") to numbers
    const parseCurrency = (value) => {
      if (typeof value !== 'string') return NaN;
      // Remove R$, thousand separators (.), replace decimal comma with dot
      const cleanedValue = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
      return parseFloat(cleanedValue);
    };

    const parsedSupplierId = parseInt(formData.supplierId);
    const parsedCost = parseCurrency(formData.cost);
    const parsedRetailPrice = parseCurrency(formData.retailPrice);
    const parsedQuantity = parseInt(formData.quantity);

    const invalidNumericFields = [];
    if (isNaN(parsedSupplierId)) invalidNumericFields.push("Fornecedor");
    if (isNaN(parsedCost)) invalidNumericFields.push("Custo");
    if (isNaN(parsedRetailPrice)) invalidNumericFields.push("Preço Venda");
    if (isNaN(parsedQuantity)) invalidNumericFields.push("Quantidade");

    if (invalidNumericFields.length > 0) {
      setFormError(
        `Valores inválidos inseridos nos campos numéricos. Verifique ${invalidNumericFields.join(", ")}.`
      );
      setLoading(false);
      return;
    }

    const negativeFields = [];
    if (parsedCost < 0) negativeFields.push("Custo");
    if (parsedRetailPrice < 0) negativeFields.push("Preço Venda");
    if (parsedQuantity < 0) negativeFields.push("Quantidade");

    if (negativeFields.length > 0) {
      setFormError(
        `Valores não podem ser negativos: ${negativeFields.join(", ")}.`
      );
      setLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      const payload = {
        nome: formData.name.trim(),
        sexo: formData.gender,
        tamanho: formData.size,
        cor_estampa: formData.colorPrint,
        fornecedor_id: parsedSupplierId,
        custo: parsedCost,
        preco_venda: parsedRetailPrice,
        quantidade_atual: parsedQuantity,
        data_compra: formData.purchaseDate || null,
      };

      console.log("[FORM DEBUG] Submitting payload:", payload);
      const response = await createProduct(payload);
      console.log("[FORM DEBUG] Create product response:", response);

      if (response.success) {
        setFormSuccess("Produto adicionado com sucesso!");
        setFormData(initialFormData); // Reset form
        if (onProductAdded) onProductAdded(); // Trigger refresh in parent
      } else {
        setFormError(response.error || "Falha ao adicionar produto. Verifique os dados.");
      }
    } catch (err) {
      console.error("[FORM DEBUG] Submit error:", err);
      setFormError(err.message || "Erro ao enviar o formulário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const productNames = useMemo(
    () => products.map((p) => ({ label: p.nome, id: p.id })),
    [products]
  );

  // Determine if supplier field should be disabled
  const isSupplierDisabled = loading || suppliers.length === 0;

  return (
    // Use Box with padding for overall form spacing
    <Box component="form" onSubmit={handleSubmit} sx={{ paddingTop: 1, paddingX: 1 }}> 
      {/* Grid container with consistent spacing */}
      <Grid container spacing={2}> 
        {/* Row 1: Nome (Full Width) */}
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={productNames}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label || ""
            }
            value={formData.name}
            onChange={handleAutocompleteChange}
            onInputChange={handleAutocompleteInputChange}
            disabled={loading}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nome do Produto"
                name="name"
                required
                fullWidth
                variant="outlined"
                size="small"
                helperText={!formData.name ? "Nome é obrigatório" : " "} // Reserve space
                error={!formData.name}
              />
            )}
          />
        </Grid>

        {/* Row 2: Sexo, Tamanho */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required size="small" error={!formData.gender}>
            <InputLabel id="gender-label">Sexo</InputLabel>
            <Select
              labelId="gender-label"
              name="gender"
              value={formData.gender}
              label="Sexo"
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Selecione...</em>
              </MenuItem>
              <MenuItem value="Masculino">Masculino</MenuItem>
              <MenuItem value="Feminino">Feminino</MenuItem>
              <MenuItem value="Unissex">Unissex</MenuItem>
            </Select>
            <FormHelperText>{!formData.gender ? "Sexo é obrigatório" : " "}</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required size="small" error={!formData.size}>
            <InputLabel id="size-label">Tamanho</InputLabel>
            <Select
              labelId="size-label"
              name="size"
              value={formData.size}
              label="Tamanho"
              onChange={handleChange}
              disabled={loading || sizeOptions.length === 0}
            >
              <MenuItem value="">
                <em>Selecione...</em>
              </MenuItem>
              {sizeOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.value}>
                  {opt.value}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{!formData.size ? "Tamanho é obrigatório" : " "}</FormHelperText>
          </FormControl>
        </Grid>

        {/* Row 3: Cor/Estampa, Fornecedor */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required size="small" error={!formData.colorPrint}>
            <InputLabel id="colorPrint-label">Cor / Estampa</InputLabel>
            <Select
              labelId="colorPrint-label"
              name="colorPrint"
              value={formData.colorPrint}
              label="Cor / Estampa"
              onChange={handleChange}
              disabled={loading || colorOptions.length === 0}
            >
              <MenuItem value="">
                <em>Selecione...</em>
              </MenuItem>
              {colorOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.value}>
                  {opt.value}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{!formData.colorPrint ? "Cor/Estampa é obrigatório" : " "}</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required size="small" error={(!loading && !formData.supplierId) || !!supplierError}>
            <InputLabel id="supplier-label">Fornecedor</InputLabel>
            <Select
              labelId="supplier-label"
              name="supplierId"
              value={formData.supplierId}
              label="Fornecedor"
              onChange={handleChange}
              disabled={isSupplierDisabled}
              displayEmpty // Important to show placeholder when value is ""
            >
              <MenuItem value="" disabled>
                {/* More informative placeholder based on state */}
                <em>{loading ? "Carregando..." : (supplierError ? "Erro ao carregar" : (suppliers.length === 0 ? "Nenhum encontrado" : "Selecione..."))}</em>
              </MenuItem>
              {Array.isArray(suppliers) && suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nome}
                </MenuItem>
              ))}
            </Select>
            {/* Show specific supplier error or general required message */}
            <FormHelperText error={!!supplierError || (!loading && !formData.supplierId)}>
              {supplierError ? supplierError : (!loading && !formData.supplierId ? "Fornecedor é obrigatório" : " ")}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Row 4: Custo, Preço Venda, Quantidade */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Custo"
            name="cost"
            value={formData.cost}
            onChange={handleChange} // Use standard handleChange
            required
            fullWidth
            variant="outlined"
            size="small" // Apply size="small" for consistency
            InputProps={{
              inputComponent: CurrencyInputAdapter,
              startAdornment: (
                <InputAdornment position="start">R$</InputAdornment>
              ),
            }}
            helperText={!formData.cost ? "Obrigatório" : " "}
            error={!formData.cost}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Preço Venda"
            name="retailPrice"
            value={formData.retailPrice}
            onChange={handleChange} // Use standard handleChange
            required
            fullWidth
            variant="outlined"
            size="small" // Apply size="small" for consistency
            InputProps={{
              inputComponent: CurrencyInputAdapter,
              startAdornment: (
                <InputAdornment position="start">R$</InputAdornment>
              ),
            }}
            helperText={!formData.retailPrice ? "Obrigatório" : " "}
            error={!formData.retailPrice}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Quantidade"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined"
            size="small" 
            inputProps={{ min: "0", step: "1" }}
            helperText={!formData.quantity ? "Obrigatório" : " "}
            error={!formData.quantity || parseInt(formData.quantity) < 0}
          />
        </Grid>

        {/* Row 5: Data da Compra (Full Width) */}
        <Grid item xs={12}>
          <TextField
            label="Data da Compra"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            helperText=" " // Reserve space
          />
        </Grid>
      </Grid>

      {/* General Form Error/Success Messages */}
      {formError && (
        <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
          {formError}
        </Alert>
      )}
      {formSuccess && (
        <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
          {formSuccess}
        </Alert>
      )}

      {/* Submit Button */}
      <Box sx={{ mt: 2.5, mb: 1, display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Adicionando..." : "Adicionar Produto"}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductForm;
