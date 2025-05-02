import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
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
import FormHelperText from "@mui/material/FormHelperText"; // Moved import to top

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Removed unused handleNameChange

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setLoading(true);

    try {
      const payload = {
        nome: formData.name,
        sexo: formData.gender,
        tamanho: formData.size,
        cor_estampa: formData.colorPrint,
        fornecedor_id: parseInt(formData.supplierId),
        custo: parseFloat(formData.cost),
        preco_venda: parseFloat(formData.retailPrice),
        quantidade_atual: parseInt(formData.quantity),
        data_compra: formData.purchaseDate || null,
      };

      if (
        isNaN(payload.fornecedor_id) ||
        isNaN(payload.custo) ||
        isNaN(payload.preco_venda) ||
        isNaN(payload.quantidade_atual)
      ) {
        throw new Error(
          "Erro na conversão de valores numéricos. Verifique os campos de Custo, Preço e Quantidade."
        );
      }
      // Basic check for required fields before submit
      if (!payload.nome || !payload.sexo || !payload.tamanho || !payload.cor_estampa || !payload.fornecedor_id || payload.custo < 0 || payload.preco_venda < 0 || payload.quantidade_atual < 0) {
        throw new Error("Por favor, preencha todos os campos obrigatórios e verifique valores negativos.");
      }

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

  // Memoize product names for Autocomplete options
  const productNames = useMemo(() => 
    products.map((p) => ({ label: p.nome, id: p.id })), 
    [products]
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {/* Show loading indicator centrally if needed, or just disable fields */}
      {/* {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mb: 2 }} />} */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={productNames}
            getOptionLabel={(option) => 
              // Handles case where option is string (typed) or object (selected)
              typeof option === 'string' ? option : option.label || ""
            }
            value={formData.name} // Control the value displayed in the input
            onChange={(event, newValue) => {
              // This handles selection from the dropdown
              const nameValue = typeof newValue === 'string' ? newValue : newValue?.label || "";
              setFormData((prev) => ({ ...prev, name: nameValue }));
            }}
            onInputChange={(event, newInputValue) => {
              // This handles typing directly into the input
              // For freeSolo, we often want this to update the state directly
              setFormData((prev) => ({ ...prev, name: newInputValue }));
            }}
            disabled={loading} // Disable while loading products
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nome do Produto"
                name="name" // Name is important for form semantics, though Autocomplete handles state
                required
                fullWidth
                error={!formData.name} // Basic validation indication
                helperText={!formData.name ? "Nome é obrigatório" : "Digite ou selecione um nome existente"}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.gender}>
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
            {!formData.gender && <FormHelperText>Sexo é obrigatório</FormHelperText>} {/* Added helper text */}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.size}>
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
            {!formData.size && <FormHelperText>Tamanho é obrigatório</FormHelperText>} {/* Added helper text */}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.colorPrint}>
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
            {!formData.colorPrint && <FormHelperText>Cor/Estampa é obrigatório</FormHelperText>} {/* Added helper text */}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!formData.supplierId}>
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
            {!formData.supplierId && <FormHelperText>Fornecedor é obrigatório</FormHelperText>} {/* Added helper text */}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Custo (R$)"
            name="cost"
            type="number"
            value={formData.cost}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{ step: "0.01", min: "0" }}
            error={formData.cost !== "" && parseFloat(formData.cost) < 0}
            helperText={formData.cost !== "" && parseFloat(formData.cost) < 0 ? "Custo não pode ser negativo" : ""}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Preço Venda (R$)"
            name="retailPrice"
            type="number"
            value={formData.retailPrice}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{ step: "0.01", min: "0" }}
            error={formData.retailPrice !== "" && parseFloat(formData.retailPrice) < 0}
            helperText={formData.retailPrice !== "" && parseFloat(formData.retailPrice) < 0 ? "Preço não pode ser negativo" : ""}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Quantidade Inicial"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{ min: "0" }}
            error={formData.quantity !== "" && parseInt(formData.quantity) < 0}
            helperText={formData.quantity !== "" && parseInt(formData.quantity) < 0 ? "Quantidade não pode ser negativa" : ""}
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

// Removed import from bottom

export default ProductForm;

