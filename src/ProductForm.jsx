import React, { useEffect, useState, useMemo, forwardRef } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  createProduct,
  fetchSuppliers,
  fetchProducts,
  fetchFieldOptions,
} from "./api";
import Box from "@mui/material/Box";
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
import CircularProgress from "@mui/material/CircularProgress";

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
        if (onChange) {
          onChange({
            target: {
              name: props.name,
              value: value === undefined || value === null ? "" : String(value),
            },
          });
        }
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
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    defaultValues: {
      name: "",
      gender: "",
      size: "",
      colorPrint: "",
      supplierId: "",
      cost: "",
      retailPrice: "",
      quantity: "",
      purchaseDate: "",
    },
  });

  // State hooks remain the same...
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [supplierError, setSupplierError] = useState("");

  const watchedSupplierId = watch("supplierId");

  // useEffect and onSubmit remain the same...
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      if (!isMounted) return;
      setLoadingOptions(true);
      setFormError("");
      setSupplierError("");

      try {
        try {
          const supplierList = await fetchSuppliers();
          if (isMounted) {
            if (Array.isArray(supplierList) && supplierList.length > 0) {
              setSuppliers(supplierList);
            } else {
              setSuppliers([]);
              setSupplierError("Nenhum fornecedor ativo encontrado.");
            }
          }
        } catch (supplierErr) {
          if (isMounted) {
            setSuppliers([]);
            setSupplierError(`Erro ao carregar fornecedores: ${supplierErr.message}`);
          }
        }

        const [productList, sizeOpts, colorOpts] = await Promise.all([
          fetchProducts(),
          fetchFieldOptions("tamanho"),
          fetchFieldOptions("cor_estampa"),
        ]);
        if (isMounted) {
          setProducts(productList || []);
          setSizeOptions(sizeOpts || []);
          setColorOptions(colorOpts || []);
        }
      } catch (err) {
        if (isMounted && !supplierError) {
          setFormError(`Erro ao carregar dados: ${err.message}.`);
        }
      } finally {
        if (isMounted) {
          setLoadingOptions(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (data) => {
    setFormError("");
    setFormSuccess("");

    const parseCurrency = (value) => {
      if (typeof value !== "string" || value.trim() === "") return NaN;
      const cleanedValue = value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".");
      return parseFloat(cleanedValue);
    };

    const parsedCost = parseCurrency(data.cost);
    const parsedRetailPrice = parseCurrency(data.retailPrice);
    const parsedQuantity = parseInt(data.quantity, 10);
    const parsedSupplierId = parseInt(data.supplierId, 10);

    const invalidNumericFields = [];
    if (isNaN(parsedSupplierId)) invalidNumericFields.push("Fornecedor");
    if (isNaN(parsedCost)) invalidNumericFields.push("Custo");
    if (isNaN(parsedRetailPrice)) invalidNumericFields.push("Preço Venda");
    if (isNaN(parsedQuantity)) invalidNumericFields.push("Quantidade");

    if (invalidNumericFields.length > 0) {
      setFormError(`Valores inválidos nos campos: ${invalidNumericFields.join(", ")}.`);
      return;
    }

    const negativeFields = [];
    if (parsedCost < 0) negativeFields.push("Custo");
    if (parsedRetailPrice < 0) negativeFields.push("Preço Venda");
    if (parsedQuantity < 0) negativeFields.push("Quantidade");

    if (negativeFields.length > 0) {
      setFormError(`Valores não podem ser negativos: ${negativeFields.join(", ")}.`);
      return;
    }

    try {
      const payload = {
        nome: data.name.trim(),
        sexo: data.gender,
        tamanho: data.size,
        cor_estampa: data.colorPrint,
        fornecedor_id: parsedSupplierId,
        custo: parsedCost,
        preco_venda: parsedRetailPrice,
        quantidade_atual: parsedQuantity,
        data_compra: data.purchaseDate || null,
      };

      console.log("[API DEBUG] Payload:", payload);
      const response = await createProduct(payload);

      if (response.success) {
        setFormSuccess("Produto adicionado com sucesso!");
        reset();
        if (onProductAdded) onProductAdded();
      } else {
        setFormError(response.error || "Falha ao adicionar produto.");
      }
    } catch (err) {
      console.error("[API DEBUG] Error during createProduct fetch:", err);
      setFormError(err.message || "Erro ao enviar o formulário.");
    }
  };

  const productNames = useMemo(
    () => products.map((p) => ({ label: p.nome, id: p.id_produto })),
    [products]
  );

  const isSupplierDisabled = loadingOptions || !!supplierError || suppliers.length === 0;

  // *** Flexbox Layout with Standard Variant ***
  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ paddingTop: 2, paddingX: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      
      {/* Line 1: NOME (large), SEXO (small), TAMANHO (small) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box sx={{ flexGrow: 1, flexBasis: { sm: '50%', md: '50%' } }}> {/* Large field */} 
          <Controller
            name="name"
            control={control}
            rules={{ required: "Nome é obrigatório" }}
            render={({ field: { onChange, value, ...fieldProps }, fieldState: { error } }) => (
              <Autocomplete
                {...fieldProps}
                freeSolo
                options={productNames}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label || ""
                }
                inputValue={value || ""}
                onInputChange={(event, newInputValue) => {
                  onChange(newInputValue);
                }}
                disabled={loadingOptions}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nome do Produto"
                    required
                    fullWidth
                    variant="standard" // Changed variant
                    error={!!error}
                    helperText={error ? error.message : " "}
                    // Removed size="small"
                  />
                )}
              />
            )}
          />
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '25%', md: '25%' } }}> {/* Small field */} 
          <Controller
            name="gender"
            control={control}
            rules={{ required: "Sexo é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth required variant="standard" error={!!error}> {/* Changed variant */} 
                <InputLabel id="gender-label">Sexo</InputLabel>
                <Select
                  {...field}
                  labelId="gender-label"
                  // Removed label prop
                  disabled={loadingOptions}
                >
                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Feminino">Feminino</MenuItem>
                  <MenuItem value="Unissex">Unissex</MenuItem>
                </Select>
                <FormHelperText>{error ? error.message : " "}</FormHelperText>
              </FormControl>
            )}
          />
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '25%', md: '25%' } }}> {/* Small field */} 
          <Controller
            name="size"
            control={control}
            rules={{ required: "Tamanho é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth required variant="standard" error={!!error}> {/* Changed variant */} 
                <InputLabel id="size-label">Tamanho</InputLabel>
                <Select
                  {...field}
                  labelId="size-label"
                  // Removed label prop
                  disabled={loadingOptions || sizeOptions.length === 0}
                >
                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                  {sizeOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.value}>
                      {opt.value}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{error ? error.message : " "}</FormHelperText>
              </FormControl>
            )}
          />
        </Box>
      </Box>

      {/* Line 2: COR/ESTAMPA (medium), FORNECEDOR (medium) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box sx={{ flexBasis: { xs: '100%', sm: '50%', md: '50%' } }}> {/* Medium field */} 
          <Controller
            name="colorPrint"
            control={control}
            rules={{ required: "Cor/Estampa é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth required variant="standard" error={!!error}> {/* Changed variant */} 
                <InputLabel id="colorPrint-label">Cor / Estampa</InputLabel>
                <Select
                  {...field}
                  labelId="colorPrint-label"
                  // Removed label prop
                  disabled={loadingOptions || colorOptions.length === 0}
                >
                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                  {colorOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.value}>
                      {opt.value}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{error ? error.message : " "}</FormHelperText>
              </FormControl>
            )}
          />
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '50%', md: '50%' } }}> {/* Medium field */} 
          <Controller
            name="supplierId"
            control={control}
            rules={{ required: "Fornecedor é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              // *** FIX: Use standard variant, remove displayEmpty, ensure label shrinks ***
              <FormControl fullWidth required variant="standard" error={!!error || !!supplierError}> 
                <InputLabel id="supplier-label" shrink={!!field.value || loadingOptions || !!supplierError || suppliers.length === 0}>
                  Fornecedor
                </InputLabel>
                <Select
                  {...field}
                  labelId="supplier-label"
                  // Removed label prop
                  disabled={isSupplierDisabled}
                  // Removed displayEmpty
                  value={field.value || ""} // Keep controlled value
                >
                  {/* Use placeholder MenuItem only when needed */}
                  {loadingOptions && <MenuItem value="" disabled><em>Carregando...</em></MenuItem>}
                  {supplierError && <MenuItem value="" disabled><em>Erro</em></MenuItem>}
                  {!loadingOptions && !supplierError && suppliers.length === 0 && <MenuItem value="" disabled><em>Nenhum</em></MenuItem>}
                  {!loadingOptions && !supplierError && suppliers.length > 0 && <MenuItem value=""><em>Selecione...</em></MenuItem>}
                  
                  {Array.isArray(suppliers) && suppliers.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nome}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText error={!!error || !!supplierError}>
                  {error ? error.message : supplierError ? supplierError : " "}
                </FormHelperText>
              </FormControl>
            )}
          />
        </Box>
      </Box>

      {/* Line 3: Custo (larger), Preço Venda (larger), Quantidade (smaller) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box sx={{ flexBasis: { xs: '100%', sm: '40%', md: '40%' } }}> {/* Larger field */} 
          <Controller
            name="cost"
            control={control}
            rules={{ required: "Custo é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Custo"
                required
                fullWidth
                variant="standard" // Changed variant
                InputProps={{
                  inputComponent: CurrencyInputAdapter,
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                error={!!error}
                helperText={error ? error.message : " "}
                // Removed size="small"
              />
            )}
          />
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '40%', md: '40%' } }}> {/* Larger field */} 
          <Controller
            name="retailPrice"
            control={control}
            rules={{ required: "Preço Venda é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Preço Venda"
                required
                fullWidth
                variant="standard" // Changed variant
                InputProps={{
                  inputComponent: CurrencyInputAdapter,
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                error={!!error}
                helperText={error ? error.message : " "}
                // Removed size="small"
              />
            )}
          />
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '20%', md: '20%' } }}> {/* Smaller field */} 
          <Controller
            name="quantity"
            control={control}
            rules={{
              required: "Quantidade é obrigatória",
              min: { value: 0, message: "Quantidade não pode ser negativa" },
              pattern: { value: /^[0-9]*$/, message: "Quantidade deve ser um número inteiro" }
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Quantidade"
                required
                fullWidth
                variant="standard" // Changed variant
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                error={!!error}
                helperText={error ? error.message : " "}
                // Removed size="small"
              />
            )}
          />
        </Box>
      </Box>

      {/* Line 4: DATA DE COMPRA */}
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
        <Box sx={{ flexBasis: { xs: '100%', sm: '50%', md: '50%' } }}> {/* Positioned on the left half */} 
          <Controller
            name="purchaseDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Data da Compra (Opcional)"
                type="date"
                fullWidth
                variant="standard" // Changed variant
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!error}
                helperText={error ? error.message : " "}
                // Removed size="small"
              />
            )}
          />
        </Box>
        <Box sx={{ flexBasis: { xs: '0%', sm: '50%', md: '50%' } }} /> {/* Spacer */} 
      </Box>

      {/* Row 5: Submit Button and Messages */}
      <Box>
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || loadingOptions}
          sx={{ mt: 1, mb: 1 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "Adicionar Produto"}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductForm;

