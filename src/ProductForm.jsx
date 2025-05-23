import React, { useEffect, useState, useMemo, forwardRef } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  createProduct,
  updateProduct,
  fetchSuppliers,
  fetchProducts,
  fetchFieldOptions,
  authFetch
} from "./api";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  Alert,
  CircularProgress
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import CurrencyInput from "react-currency-input-field";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

// Adapter for react-currency-input-field
const CurrencyInputAdapter = forwardRef(function (props, ref) {
  const { onChange, ...other } = props;
  return (
    <CurrencyInput
      {...other}
      ref={ref}
      onValueChange={(value) => {
        onChange?.({ target: { name: props.name, value: value ?? "" } });
      }}
      allowNegativeValue={false}
      decimalSeparator=","
      groupSeparator="."
      decimalsLimit={2}
      prefix=""
    />
  );
});

const ProductForm = ({ onProductAdded, initialData, isEditMode }) => {
  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    defaultValues: initialData
      ? {
          name: initialData.nome || "",
          gender: initialData.sexo || "",
          size: initialData.tamanho || "",
          colorPrint: initialData.cor_estampa || "",
          supplierId: initialData.fornecedor_id ? String(initialData.fornecedor_id) : "",
          cost: initialData.custo ? String(initialData.custo) : "",
          retailPrice: initialData.preco_venda ? String(initialData.preco_venda) : "",
          quantity: "1",
          purchaseDate: initialData.data_compra || dayjs().format("YYYY-MM-DD"),
        }
      : {
          name: "",
          gender: "",
          size: "",
          colorPrint: "",
          supplierId: "",
          cost: "",
          retailPrice: "",
          quantity: "1",
          purchaseDate: dayjs().format("YYYY-MM-DD"),
        },
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formError, setFormError] = useState("");
  const [supplierError, setSupplierError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState(false);

  // Load suppliers & field options
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingOptions(true);
      try {
        const [supList, prodList, sizes, colors] = await Promise.all([
          fetchSuppliers(),
          fetchProducts(),
          fetchFieldOptions("tamanho"),
          fetchFieldOptions("cor_estampa"),
        ]);
        if (!isMounted) return;
        setSuppliers(Array.isArray(supList) ? supList : []);
        setProducts(Array.isArray(prodList) ? prodList : []);
        setSizeOptions(Array.isArray(sizes) ? sizes : []);
        setColorOptions(Array.isArray(colors) ? colors : []);
      } catch (e) {
        console.error(e);
        setFormError("Erro ao carregar dados: " + e.message);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const parseCurrency = (value) => {
    if (!value) return 0;
    const cleaned = String(value).replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  };

  const onSubmit = async (data) => {
    setFormError("");
    setIsProcessing(true);

    try {
      const basePayload = {
        nome: data.name.trim(),
        sexo: data.gender,
        tamanho: data.size,
        cor_estampa: data.colorPrint,
        fornecedor_id: parseInt(data.supplierId, 10),
        custo: parseCurrency(data.cost),
        preco_venda: parseCurrency(data.retailPrice),
        data_compra: data.purchaseDate || null,
      };

      if (isEditMode) {
        const updatePayload = {
          ...basePayload,
          quantidade_atual: 1,
        };
        const res = await authFetch(`/produtos/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(updatePayload),
        });
        if (res.success) {
          reset();
          onProductAdded();
        } else {
          setFormError(res.error || "Falha ao atualizar produto.");
        }
      } else {
        const quantity = parseInt(data.quantity, 10) || 1;
        const createPromises = [];
        for (let i = 0; i < quantity; i++) {
          createPromises.push(
            createProduct({ ...basePayload, quantidade_atual: 1 })
          );
        }
        const results = await Promise.all(createPromises);
        const failures = results.filter((r) => !r.success);
        if (failures.length > 0) {
          setFormError(`Falha ao adicionar ${failures.length} de ${quantity} produtos.`);
        } else {
          reset();
          onProductAdded();
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Erro ao enviar formulário.");
    } finally {
      setIsProcessing(false);
    }
  };

  const productNames = useMemo(() => {
    try {
      return Array.isArray(products)
        ? [...new Set(products.map((p) => p.nome))]
            .filter(Boolean)
            .map((name) => ({ label: name }))
        : [];
    } catch (err) {
      console.error("Error preparing product names:", err);
      setAutocompleteError(true);
      return [];
    }
  }, [products]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={3}
        sx={{
          maxWidth: 800,
          mx: "auto",
          mt: 4,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          {isEditMode ? "Editar Produto" : "Novo Produto"}
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            {/* Row 1: Nome, Sexo, Tamanho */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Nome é obrigatório" }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    {autocompleteError ? (
                      <TextField
                        {...field}
                        label="Nome do Produto"
                        required
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || "Autocomplete indisponível"}
                        disabled={loadingOptions || isProcessing}
                      />
                    ) : (
                      <Autocomplete
                        freeSolo
                        options={productNames}
                        loading={loadingOptions}
                        disabled={loadingOptions || isProcessing}
                        value={field.value}
                        onChange={(_, v) => field.onChange(typeof v === "string" ? v : v?.label || "")}
                        onInputChange={(_, v) => field.onChange(v)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Nome do Produto"
                            required
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message || " "}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingOptions && <CircularProgress size={20} />}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="gender"
                control={control}
                rules={{ required: "Sexo é obrigatório" }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel required id="gender-label">
                      Sexo
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="gender-label"
                      label="Sexo"
                      disabled={loadingOptions || isProcessing}
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      <MenuItem value="Masculino">Masculino</MenuItem>
                      <MenuItem value="Feminino">Feminino</MenuItem>
                      <MenuItem value="Unissex">Unissex</MenuItem>
                    </Select>
                    <FormHelperText>{fieldState.error?.message || " "}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="size"
                control={control}
                rules={{ required: "Tamanho é obrigatório" }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel required id="size-label">
                      Tamanho
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="size-label"
                      label="Tamanho"
                      disabled={loadingOptions || isProcessing}
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      {sizeOptions.map((o) => (
                        <MenuItem key={o.id} value={o.value}>
                          {o.value}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{fieldState.error?.message || " "}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Row 2: Cor/Estampa, Fornecedor */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="colorPrint"
                control={control}
                rules={{ required: "Cor/Estampa é obrigatório" }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel required id="color-label">
                      Cor/Estampa
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="color-label"
                      label="Cor/Estampa"
                      disabled={loadingOptions || isProcessing}
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      {colorOptions.map((o) => (
                        <MenuItem key={o.id} value={o.value}>
                          {o.value}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{fieldState.error?.message || " "}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="supplierId"
                control={control}
                rules={{ required: "Fornecedor é obrigatório" }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error || !!supplierError}>
                    <InputLabel required id="supplier-label">
                      Fornecedor
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="supplier-label"
                      label="Fornecedor"
                      disabled={loadingOptions || isProcessing}
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      {suppliers.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>
                          {s.nome}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {fieldState.error?.message || supplierError || " "}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Row 3: Custo, Preço de Venda, Quantidade */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="cost"
                control={control}
                rules={{ required: "Custo é obrigatório" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label="Custo"
                    InputProps={{
                      inputComponent: CurrencyInputAdapter,
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    disabled={loadingOptions || isProcessing}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || " "}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="retailPrice"
                control={control}
                rules={{ required: "Preço de venda é obrigatório" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label="Preço de Venda"
                    InputProps={{
                      inputComponent: CurrencyInputAdapter,
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    disabled={loadingOptions || isProcessing}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || " "}
                  />
                )}
              />
            </Grid>

            {!isEditMode && (
              <Grid item xs={12} sm={4}>
                <Controller
                  name="quantity"
                  control={control}
                  rules={{
                    required: "Quantidade é obrigatória",
                    min: { value: 1, message: "Quantidade mínima é 1" },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      type="number"
                      label="Quantidade"
                      InputProps={{ inputProps: { min: 1 } }}
                      disabled={loadingOptions || isProcessing}
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ||
                        "Cada unidade será adicionada como um item separado"
                      }
                    />
                  )}
                />
              </Grid>
            )}

            {/* Row 4: Data de Compra */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Data de Compra"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? date.format("YYYY-MM-DD") : null)
                    }
                    disabled={loadingOptions || isProcessing}
                    slotProps={{
                      textField: { fullWidth: true, helperText: " " },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {formError && (
            <Box mt={2}>
              <Alert severity="error">{formError}</Alert>
            </Box>
          )}

          {autocompleteError && (
            <Box mt={2}>
              <Alert severity="warning">
                Houve um problema com o autocompletar de nomes. Usando campo de texto
                simples.
              </Alert>
            </Box>
          )}

          {!isEditMode ? (
            <Box mt={2}>
              <Alert severity="info">
                Novo paradigma: Cada produto terá quantidade = 1. Se você adicionar um
                produto com quantidade maior que 1, serão criadas múltiplas linhas
                idênticas com quantidade = 1 cada.
              </Alert>
            </Box>
          ) : (
            <Box mt={2}>
              <Alert severity="info">
                No modo de edição, a quantidade é sempre 1 por item, seguindo o novo
                paradigma de estoque.
              </Alert>
            </Box>
          )}

          <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || loadingOptions || isProcessing}
              startIcon={
                (isSubmitting || isProcessing) && (
                  <CircularProgress color="inherit" size={20} />
                )
              }
            >
              {isEditMode ? "Salvar" : "Adicionar Produto"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default ProductForm;
