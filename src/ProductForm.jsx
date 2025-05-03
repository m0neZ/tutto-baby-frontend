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

// Adapter component (unchanged)
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
  const [supplierError, setSupplierError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      console.log("[FORM DEBUG] Starting loadInitialData...");
      if (!isMounted) return;
      setLoading(true);
      setFormError("");
      setSupplierError(""); 

      let supplierFetchSuccess = false; 

      try {
        try {
          console.log("[FORM DEBUG] Fetching suppliers...");
          const supplierList = await fetchSuppliers();
          supplierFetchSuccess = true; 
          console.log("[FORM DEBUG] Raw Fetched Suppliers in Form:", supplierList);
          if (isMounted) {
            if (Array.isArray(supplierList) && supplierList.length > 0) {
              setSuppliers(supplierList);
              console.log("[FORM DEBUG] Suppliers state updated with:", supplierList);
            } else {
              setSuppliers([]);
              setSupplierError("Nenhum fornecedor ativo encontrado no banco de dados."); 
              console.warn("[FORM DEBUG] Successfully fetched suppliers, but the list is empty.");
            }
          }
        } catch (supplierErr) {
          console.error("[FORM DEBUG] Error fetching suppliers:", supplierErr);
          if (isMounted) {
            setSuppliers([]); 
            setSupplierError(`Erro ao carregar fornecedores: ${supplierErr.message}`); 
          }
          throw new Error("Supplier fetch failed, stopping initial data load."); 
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
        console.error("[FORM DEBUG] Error during secondary data load:", err);
        if (isMounted) {
          if (!supplierError) { 
            setFormError(
              `Erro ao carregar dados adicionais: ${err.message}. Verifique a conexão.`
            );
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

    return () => {
      isMounted = false;
      console.log("[FORM DEBUG] ProductForm unmounted or dependency changed.");
    };
  }, []); // Empty dependency array

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

    // --- Validation (unchanged) --- 
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
    const parseCurrency = (value) => {
      if (typeof value !== 'string') return NaN;
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

  const isSupplierDisabled = loading || !!supplierError || suppliers.length === 0;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ paddingTop: 1, paddingX: 0 }}> 
      <Grid container spacing={3}> {/* Increased spacing for standard variant */} 
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
            // size="small" // Remove size for standard variant
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nome do Produto"
                name="name"
                required
                fullWidth
                variant="standard" // *** CHANGE: Use standard variant ***
                // size="small" // Remove size
                helperText={!formData.name ? "Nome é obrigatório" : " "} 
                error={!formData.name}
              />
            )}
          />
        </Grid>

        {/* Row 2: Sexo, Tamanho */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required variant="standard" error={!formData.gender}> {/* *** CHANGE: Use standard variant *** */}
            <InputLabel id="gender-label">Sexo</InputLabel>
            <Select
              labelId="gender-label"
              name="gender"
              value={formData.gender}
              // label="Sexo" // Label provided by InputLabel
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value=""><em>Selecione...</em></MenuItem>
              <MenuItem value="Masculino">Masculino</MenuItem>
              <MenuItem value="Feminino">Feminino</MenuItem>
              <MenuItem value="Unissex">Unissex</MenuItem>
            </Select>
            <FormHelperText>{!formData.gender ? "Sexo é obrigatório" : " "}</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required variant="standard" error={!formData.size}> {/* *** CHANGE: Use standard variant *** */}
            <InputLabel id="size-label">Tamanho</InputLabel>
            <Select
              labelId="size-label"
              name="size"
              value={formData.size}
              // label="Tamanho" // Label provided by InputLabel
              onChange={handleChange}
              disabled={loading || sizeOptions.length === 0}
            >
              <MenuItem value=""><em>Selecione...</em></MenuItem>
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
          <FormControl fullWidth required variant="standard" error={!formData.colorPrint}> {/* *** CHANGE: Use standard variant *** */}
            <InputLabel id="colorPrint-label">Cor / Estampa</InputLabel>
            <Select
              labelId="colorPrint-label"
              name="colorPrint"
              value={formData.colorPrint}
              // label="Cor / Estampa" // Label provided by InputLabel
              onChange={handleChange}
              disabled={loading || colorOptions.length === 0}
            >
              <MenuItem value=""><em>Selecione...</em></MenuItem>
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
          <FormControl fullWidth required variant="standard" error={(!loading && !formData.supplierId) || !!supplierError}> {/* *** CHANGE: Use standard variant *** */}
            <InputLabel id="supplier-label">
              Fornecedor
            </InputLabel>
            <Select
              labelId="supplier-label"
              name="supplierId"
              value={formData.supplierId}
              // label="Fornecedor" // Label provided by InputLabel
              onChange={handleChange}
              disabled={isSupplierDisabled}
              displayEmpty 
            >
              <MenuItem value="" disabled>
                <em>{loading ? "Carregando..." : (supplierError ? "Erro" : (suppliers.length === 0 ? "Nenhum" : "Selecione..."))}</em>
              </MenuItem>
              {Array.isArray(suppliers) && suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nome}
                </MenuItem>
              ))}
            </Select>
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
            onChange={handleChange} 
            required
            fullWidth
            variant="standard" // *** CHANGE: Use standard variant ***
            // size="small" // Remove size
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
            onChange={handleChange} 
            required
            fullWidth
            variant="standard" // *** CHANGE: Use standard variant ***
            // size="small" // Remove size
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
            variant="standard" // *** CHANGE: Use standard variant ***
            // size="small" // Remove size
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
            variant="standard" // *** CHANGE: Use standard variant ***
            // size="small" // Remove size
            InputLabelProps={{
              shrink: true,
            }}
            helperText=" " // Add space for consistent height
          />
        </Grid>

        {/* Row 6: Submit Button */}
        <Grid item xs={12} sx={{ textAlign: "right", mt: 2 }}>
          {formError && <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2, textAlign: "left" }}>{formSuccess}</Alert>}
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar Produto"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductForm;

