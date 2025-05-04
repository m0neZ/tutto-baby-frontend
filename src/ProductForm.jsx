import React, { useEffect, useState, useMemo, forwardRef } from "react";
import { useForm, Controller } from "react-hook-form";
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
        // Ensure onChange is called only if it exists
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
    setValue, // Use setValue to update form state programmatically if needed
    watch // Use watch to observe field values if needed
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

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [supplierError, setSupplierError] = useState("");

  // Watch supplierId to manage label shrink
  const watchedSupplierId = watch("supplierId");

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      if (!isMounted) return;
      setLoadingOptions(true);
      setFormError("");
      setSupplierError("");

      try {
        // Fetch suppliers first
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

        // Fetch other options
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

    // --- Validation (Handled by react-hook-form rules, but keep parsing/numeric checks) ---
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
    // --- End Validation ---

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

      const response = await createProduct(payload);

      if (response.success) {
        setFormSuccess("Produto adicionado com sucesso!");
        reset(); // Reset form using react-hook-form's reset
        if (onProductAdded) onProductAdded();
      } else {
        setFormError(response.error || "Falha ao adicionar produto.");
      }
    } catch (err) {
      setFormError(err.message || "Erro ao enviar o formulário.");
    }
  };

  const productNames = useMemo(
    () => products.map((p) => ({ label: p.nome, id: p.id_produto })), // Use id_produto
    [products]
  );

  const isSupplierDisabled = loadingOptions || !!supplierError || suppliers.length === 0;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ paddingTop: 1 }}>
      <Grid container spacing={2}> {/* Reduced spacing slightly */}
        {/* Row 1: Nome (Full Width) */}
        <Grid item xs={12}>
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
                inputValue={value || ""} // Control input value
                onInputChange={(event, newInputValue) => {
                  onChange(newInputValue); // Update form state
                }}
                disabled={loadingOptions}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nome do Produto"
                    required
                    fullWidth
                    variant="standard"
                    error={!!error}
                    helperText={error ? error.message : " "}
                  />
                )}
              />
            )}
          />
        </Grid>

        {/* Row 2: Sexo, Tamanho */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="gender"
            control={control}
            rules={{ required: "Sexo é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth required variant="standard" error={!!error}>
                <InputLabel id="gender-label">Sexo</InputLabel>
                <Select
                  {...field}
                  labelId="gender-label"
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
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="size"
            control={control}
            rules={{ required: "Tamanho é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth required variant="standard" error={!!error}>
                <InputLabel id="size-label">Tamanho</InputLabel>
                <Select
                  {...field}
                  labelId="size-label"
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
        </Grid>

        {/* Row 3: Cor/Estampa, Fornecedor */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="colorPrint"
            control={control}
            rules={{ required: "Cor/Estampa é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth required variant="standard" error={!!error}>
                <InputLabel id="colorPrint-label">Cor / Estampa</InputLabel>
                <Select
                  {...field}
                  labelId="colorPrint-label"
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
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="supplierId"
            control={control}
            rules={{ required: "Fornecedor é obrigatório" }}
            render={({ field, fieldState: { error } }) => (
              // Use watched value to determine shrink, avoids direct state manipulation
              <FormControl fullWidth required variant="standard" error={!!error || !!supplierError}>
                <InputLabel id="supplier-label" shrink={!!field.value || isSupplierDisabled}>
                  Fornecedor
                </InputLabel>
                <Select
                  {...field}
                  labelId="supplier-label"
                  disabled={isSupplierDisabled}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    <em>{loadingOptions ? "Carregando..." : (supplierError ? "Erro" : (suppliers.length === 0 ? "Nenhum" : "Selecione..."))}</em>
                  </MenuItem>
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
        </Grid>

        {/* Row 4: Custo, Preço Venda, Quantidade */}
        <Grid item xs={12} sm={4}>
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
                variant="standard"
                InputProps={{
                  inputComponent: CurrencyInputAdapter,
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                error={!!error}
                helperText={error ? error.message : " "}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
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
                variant="standard"
                InputProps={{
                  inputComponent: CurrencyInputAdapter,
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                error={!!error}
                helperText={error ? error.message : " "}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
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
                variant="standard"
                type="number"
                InputProps={{ inputProps: { min: 0 } }} // HTML5 validation
                error={!!error}
                helperText={error ? error.message : " "}
              />
            )}
          />
        </Grid>

        {/* Row 5: Data Compra */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="purchaseDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Data da Compra (Opcional)"
                type="date"
                fullWidth
                variant="standard"
                InputLabelProps={{
                  shrink: true, // Always shrink for date input
                }}
                error={!!error}
                helperText={error ? error.message : " "}
              />
            )}
          />
        </Grid>

        {/* Row 6: Submit Button and Messages */}
        <Grid item xs={12}>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || loadingOptions}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Adicionar Produto"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductForm;

