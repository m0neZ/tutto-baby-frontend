import React, { useEffect, useState, useMemo } from "react";
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
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import FormHelperText from "@mui/material/FormHelperText";
import CurrencyInput from 'react-currency-input-field'; // Import CurrencyInput

const ProductForm = ({ onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    size: "",
    colorPrint: "",
    supplierId: "",
    cost: "", // Store raw numeric value or empty string
    retailPrice: "", // Store raw numeric value or empty string
    quantity: "",
    purchaseDate: "",
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setFormError("");
      try {
        const [supplierList, productList, sizeOpts, colorOpts] = await Promise.all([
          fetchSuppliers(), 
          fetchProducts(),
          fetchFieldOptions("tamanho"),
          fetchFieldOptions("cor_estampa"),
        ]);
        setSuppliers(supplierList || []);
        setProducts(productList || []);
        setSizeOptions(sizeOpts || []);
        setColorOptions(colorOpts || []);
      } catch (err) {
        console.error("Error loading initial form data:", err);
        setFormError(
          "Erro ao carregar dados necessários para o formulário (fornecedores, opções, etc.)."
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Generic handler for standard inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Specific handler for CurrencyInput fields
  const handleCurrencyChange = (value, name) => {
    // value is the raw numeric string (e.g., "1234.56") or undefined
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setLoading(true);

    try {
      // Check for empty required numeric fields first
      if (formData.cost.trim() === '' || formData.retailPrice.trim() === '' || formData.quantity.trim() === '') {
        throw new Error("Campos de Custo, Preço Venda e Quantidade são obrigatórios e não podem estar vazios.");
      }
      
      // Attempt parsing - cost and retailPrice are already numeric strings from CurrencyInput
      const parsedSupplierId = parseInt(formData.supplierId);
      const parsedCost = parseFloat(formData.cost); // Already a numeric string or empty
      const parsedRetailPrice = parseFloat(formData.retailPrice); // Already a numeric string or empty
      const parsedQuantity = parseInt(formData.quantity);

      // Check if parsing resulted in NaN (handles invalid non-empty input like "abc" for quantity/supplierId)
      if (
        isNaN(parsedSupplierId) ||
        isNaN(parsedCost) || // Check cost
        isNaN(parsedRetailPrice) || // Check retailPrice
        isNaN(parsedQuantity)
      ) {
        throw new Error(
          "Valores inválidos inseridos nos campos numéricos. Verifique Fornecedor, Custo, Preço Venda e Quantidade."
        );
      }

      const payload = {
        nome: formData.name,
        sexo: formData.gender,
        tamanho: formData.size,
        cor_estampa: formData.colorPrint,
        fornecedor_id: parsedSupplierId,
        custo: parsedCost,
        preco_venda: parsedRetailPrice,
        quantidade_atual: parsedQuantity,
        data_compra: formData.purchaseDate || null, // Handle empty date
      };

      // Check for other required fields (non-numeric) and negative values
      if (!payload.nome || !payload.sexo || !payload.tamanho || !payload.cor_estampa || !payload.fornecedor_id || payload.custo < 0 || payload.preco_venda < 0 || payload.quantidade_atual < 0) {
        throw new Error("Por favor, preencha todos os campos obrigatórios e verifique se os valores numéricos não são negativos.");
      }

      const response = await createProduct(payload);

      if (response.success) {
        setFormSuccess("Produto adicionado com sucesso!");
        setFormData({ // Reset form
          name: "",
          gender: "",
          size: "",
          colorPrint: "",
          supplierId: "",
          cost: "",
          retailPrice: "",
          quantity: "",
          purchaseDate: "",
        });
        if (onProductAdded) onProductAdded(); // Callback to refresh list
      } else {
        setFormError(response.error || "Falha ao adicionar produto.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(err.message || "Erro ao enviar o formulário.");
    } finally {
      setLoading(false);
    }
  };

  // Memoize product names for Autocomplete options
  const productNames = useMemo(() => 
    products.map((p) => ({ label: p.nome, id: p.id })), 
    [products]
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        {/* ... other fields ... */}
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={productNames}
            getOptionLabel={(option) => 
              typeof option === 'string' ? option : option.label || ""
            }
            value={formData.name}
            onChange={(event, newValue) => {
              const nameValue = typeof newValue === 'string' ? newValue : newValue?.label || "";
              setFormData((prev) => ({ ...prev, name: nameValue }));
            }}
            onInputChange={(event, newInputValue) => {
              setFormData((prev) => ({ ...prev, name: newInputValue }));
            }}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nome do Produto"
                name="name"
                required
                fullWidth
                error={!formData.name}
                helperText={!formData.name ? "Nome é obrigatório" : "Digite ou selecione um nome existente"}
                variant="outlined" // Ensure consistent styling
                size="small" // Optional: make fields less tall
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.gender} size="small">
            <InputLabel id="gender-label">Sexo</InputLabel>
            <Select
              labelId="gender-label"
              name="gender"
              value={formData.gender}
              label="Sexo"
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value=""><em>Selecione...</em></MenuItem>
              <MenuItem value="Masculino">Masculino</MenuItem>
              <MenuItem value="Feminino">Feminino</MenuItem>
              <MenuItem value="Unissex">Unissex</MenuItem>
            </Select>
            {!formData.gender && <FormHelperText>Sexo é obrigatório</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.size} size="small">
            <InputLabel id="size-label">Tamanho</InputLabel>
            <Select
              labelId="size-label"
              name="size"
              value={formData.size}
              label="Tamanho"
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
            {!formData.size && <FormHelperText>Tamanho é obrigatório</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.colorPrint} size="small">
            <InputLabel id="colorPrint-label">Cor / Estampa</InputLabel>
            <Select
              labelId="colorPrint-label"
              name="colorPrint"
              value={formData.colorPrint}
              label="Cor / Estampa"
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
            {!formData.colorPrint && <FormHelperText>Cor/Estampa é obrigatório</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.supplierId} size="small">
            <InputLabel id="supplier-label">Fornecedor</InputLabel>
            <Select
              labelId="supplier-label"
              name="supplierId"
              value={formData.supplierId}
              label="Fornecedor"
              onChange={handleChange}
              disabled={loading || suppliers.length === 0}
            >
              <MenuItem value=""><em>Selecione...</em></MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nome}
                </MenuItem>
              ))}
            </Select>
            {!formData.supplierId && <FormHelperText>Fornecedor é obrigatório</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Currency Inputs */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required error={formData.cost === "" || parseFloat(formData.cost) < 0} size="small">
            <InputLabel htmlFor="cost-input">Custo (R$)</InputLabel>
            <CurrencyInput
              id="cost-input"
              name="cost"
              placeholder="R$ 0,00"
              value={formData.cost} // Use the raw value from state
              decimalsLimit={2}
              decimalSeparator=","
              groupSeparator="."
              prefix="R$ "
              onValueChange={(value, name) => handleCurrencyChange(value, name)} // Use onValueChange
              disabled={loading}
              allowNegativeValue={false}
              style={{ // Basic styling to mimic TextField
                padding: '8.5px 14px',
                fontSize: '1rem',
                borderRadius: '4px',
                border: `1px solid ${formData.cost === "" || parseFloat(formData.cost) < 0 ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)'}`,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            {(formData.cost === "" || parseFloat(formData.cost) < 0) && 
             <FormHelperText error>{formData.cost === "" ? "Custo é obrigatório" : "Custo não pode ser negativo"}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required error={formData.retailPrice === "" || parseFloat(formData.retailPrice) < 0} size="small">
            <InputLabel htmlFor="retailPrice-input">Preço Venda (R$)</InputLabel>
            <CurrencyInput
              id="retailPrice-input"
              name="retailPrice"
              placeholder="R$ 0,00"
              value={formData.retailPrice}
              decimalsLimit={2}
              decimalSeparator=","
              groupSeparator="."
              prefix="R$ "
              onValueChange={(value, name) => handleCurrencyChange(value, name)}
              disabled={loading}
              allowNegativeValue={false}
              style={{ // Basic styling to mimic TextField
                padding: '8.5px 14px',
                fontSize: '1rem',
                borderRadius: '4px',
                border: `1px solid ${formData.retailPrice === "" || parseFloat(formData.retailPrice) < 0 ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)'}`,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            {(formData.retailPrice === "" || parseFloat(formData.retailPrice) < 0) && 
             <FormHelperText error>{formData.retailPrice === "" ? "Preço Venda é obrigatório" : "Preço não pode ser negativo"}</FormHelperText>}
          </FormControl>
        </Grid>
        
        {/* Quantity Input */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Quantidade Inicial"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{ min: "0", step: "1" }} // Ensure integer steps
            error={formData.quantity === "" || parseInt(formData.quantity) < 0}
            helperText={formData.quantity === "" ? "Quantidade é obrigatória" : (parseInt(formData.quantity) < 0 ? "Quantidade não pode ser negativa" : "")}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Data da Compra"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            size="small"
          />
        </Grid>
      </Grid>

      {formError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {formError}
        </Alert>
      )}
      {formSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {formSuccess}
        </Alert>
      )}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Adicionando..." : "Adicionar Produto"}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductForm;
