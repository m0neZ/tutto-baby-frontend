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
import Autocomplete from "@mui/material/Autocomplete";
import FormHelperText from "@mui/material/FormHelperText";
import CurrencyInput from "react-currency-input-field";
import InputAdornment from "@mui/material/InputAdornment";
import { styled } from "@mui/material/styles";

// Custom Input component that integrates CurrencyInput with MUI styling
// Removed - Using InputProps.inputComponent directly is simpler

const ProductForm = ({ onProductAdded }) => {
  const [formData, setFormData] = useState({
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
        console.log("Fetched Suppliers in Form:", supplierList);
        setSuppliers(supplierList || []);
        setProducts(productList || []);
        setSizeOptions(sizeOpts || []);
        setColorOptions(colorOpts || []);
      } catch (err) {
        console.error("Error loading initial form data:", err);
        setFormError(`Erro ao carregar dados: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (value, name) => {
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setLoading(true);

    try {
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
        throw new Error(
          `Campos obrigatórios faltando: ${missingFields.join(", ")}.`
        );
      }

      const parsedSupplierId = parseInt(formData.supplierId);
      const parsedCost = parseFloat(formData.cost);
      const parsedRetailPrice = parseFloat(formData.retailPrice);
      const parsedQuantity = parseInt(formData.quantity);

      const invalidNumericFields = [];
      if (isNaN(parsedSupplierId)) invalidNumericFields.push("Fornecedor");
      if (isNaN(parsedCost)) invalidNumericFields.push("Custo");
      if (isNaN(parsedRetailPrice)) invalidNumericFields.push("Preço Venda");
      if (isNaN(parsedQuantity)) invalidNumericFields.push("Quantidade");

      if (invalidNumericFields.length > 0) {
        throw new Error(
          `Valores inválidos inseridos nos campos numéricos. Verifique ${invalidNumericFields.join(
            ", "
          )}.`
        );
      }

      const negativeFields = [];
      if (parsedCost < 0) negativeFields.push("Custo");
      if (parsedRetailPrice < 0) negativeFields.push("Preço Venda");
      if (parsedQuantity < 0) negativeFields.push("Quantidade");

      if (negativeFields.length > 0) {
        throw new Error(
          `Valores não podem ser negativos: ${negativeFields.join(", ")}.`
        );
      }

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

      const response = await createProduct(payload);

      if (response.success) {
        setFormSuccess("Produto adicionado com sucesso!");
        setFormData({
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
        if (onProductAdded) onProductAdded();
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

  const productNames = useMemo(
    () => products.map((p) => ({ label: p.nome, id: p.id })),
    [products]
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {/* Consistent spacing and layout */} 
      <Grid container spacing={2.5}> 
        {/* Row 1: Nome (Full Width) */}
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={productNames}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label || ""
            }
            value={formData.name}
            onChange={(event, newValue) => {
              const nameValue =
                typeof newValue === "string" ? newValue : newValue?.label || "";
              setFormData((prev) => ({ ...prev, name: nameValue }));
            }}
            onInputChange={(event, newInputValue) => {
              setFormData((prev) => ({ ...prev, name: newInputValue }));
            }}
            disabled={loading}
            size="small" // Consistent size
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nome do Produto"
                name="name"
                required
                fullWidth
                error={!formData.name}
                helperText={
                  !formData.name
                    ? "Nome é obrigatório"
                    : "Digite ou selecione um nome existente"
                }
                variant="outlined"
                size="small"
              />
            )}
          />
        </Grid>

        {/* Row 2: Sexo, Tamanho */}
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
              <MenuItem value="">
                <em>Selecione...</em>
              </MenuItem>
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
              <MenuItem value="">
                <em>Selecione...</em>
              </MenuItem>
              {sizeOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.value}>
                  {opt.value}
                </MenuItem>
              ))}
            </Select>
            {!formData.size && <FormHelperText>Tamanho é obrigatório</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Row 3: Cor/Estampa, Fornecedor */}
        <Grid item xs={12} sm={6}>
          <FormControl
            fullWidth
            required
            error={!formData.colorPrint}
            size="small"
          >
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
            {!formData.colorPrint && (
              <FormHelperText>Cor/Estampa é obrigatório</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl
            fullWidth
            required
            error={!formData.supplierId}
            size="small"
          >
            <InputLabel id="supplier-label">Fornecedor</InputLabel>
            <Select
              labelId="supplier-label"
              name="supplierId"
              value={formData.supplierId}
              label="Fornecedor"
              onChange={handleChange}
              disabled={loading || suppliers.length === 0}
            >
              <MenuItem value="">
                <em>Selecione...</em>
              </MenuItem>
              {Array.isArray(suppliers) &&
                suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nome}
                  </MenuItem>
                ))}
            </Select>
            {!formData.supplierId && (
              <FormHelperText>Fornecedor é obrigatório</FormHelperText>
            )}
            {suppliers.length === 0 && !loading && (
              <FormHelperText>Nenhum fornecedor encontrado.</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Row 4: Custo, Preço Venda, Quantidade */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Custo"
            name="cost"
            value={formData.cost}
            onChange={(e) => handleCurrencyChange(e.target.value, "cost")}
            required
            fullWidth
            error={formData.cost === "" || parseFloat(formData.cost) < 0}
            helperText={
              formData.cost === ""
                ? "Obrigatório"
                : parseFloat(formData.cost) < 0
                ? "Inválido"
                : ""
            }
            variant="outlined"
            size="small"
            InputProps={{
              inputComponent: CurrencyInputAdapter,
              inputProps: {
                decimalSeparator: ",",
                groupSeparator: ".",
                decimalsLimit: 2,
                allowNegativeValue: false,
              },
              startAdornment: (
                <InputAdornment position="start">R$</InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Preço Venda"
            name="retailPrice"
            value={formData.retailPrice}
            onChange={(e) => handleCurrencyChange(e.target.value, "retailPrice")}
            required
            fullWidth
            error={
              formData.retailPrice === "" ||
              parseFloat(formData.retailPrice) < 0
            }
            helperText={
              formData.retailPrice === ""
                ? "Obrigatório"
                : parseFloat(formData.retailPrice) < 0
                ? "Inválido"
                : ""
            }
            variant="outlined"
            size="small"
            InputProps={{
              inputComponent: CurrencyInputAdapter,
              inputProps: {
                decimalSeparator: ",",
                groupSeparator: ".",
                decimalsLimit: 2,
                allowNegativeValue: false,
              },
              startAdornment: (
                <InputAdornment position="start">R$</InputAdornment>
              ),
            }}
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
            inputProps={{ min: "0", step: "1" }}
            error={formData.quantity === "" || parseInt(formData.quantity) < 0}
            helperText={
              formData.quantity === ""
                ? "Obrigatório"
                : parseInt(formData.quantity) < 0
                ? "Inválido"
                : ""
            }
            variant="outlined"
            size="small"
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
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            size="small"
          />
        </Grid>
      </Grid>

      {/* Alerts and Submit Button */} 
      {formError && (
        <Alert severity="error" sx={{ mt: 2.5, mb: 1 }}>
          {formError}
        </Alert>
      )}
      {formSuccess && (
        <Alert severity="success" sx={{ mt: 2.5, mb: 1 }}>
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

// Adapter component to bridge CurrencyInput with MUI TextField
const CurrencyInputAdapter = React.forwardRef(function CurrencyInputAdapter(
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
            value: value,
          },
        });
      }}
      placeholder=""
      prefix=""
      // Apply basic styles to match TextField size="small"
      style={{ 
          padding: 0, // Padding is handled by TextField
          border: "none", 
          fontSize: "inherit", 
          fontFamily: "inherit",
          backgroundColor: "transparent",
          outline: "none",
          width: "100%", // Ensure it fills the TextField
      }}
    />
  );
});

export default ProductForm;
