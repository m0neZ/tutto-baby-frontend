import React, { useEffect, useState, useMemo, forwardRef } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  createProduct,
  updateProduct,
  fetchSuppliers,
  fetchProducts,
  fetchFieldOptions,
  authFetch,
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
  /** BUSINESS LOGIC + VALIDATION (UNCHANGED) **/
  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
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
          quantity: "1", // Always set to 1 for edit mode
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

  // Load select options (UNCHANGED)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [supList, prodList, sizes, colors] = await Promise.all([
          fetchSuppliers(),
          fetchProducts(),
          fetchFieldOptions("tamanho"),
          fetchFieldOptions("cor_estampa"),
        ]);
        if (!mounted) return;
        setSuppliers(Array.isArray(supList) ? supList : []);
        setProducts(Array.isArray(prodList) ? prodList : []);
        setSizeOptions(Array.isArray(sizes) ? sizes : []);
        setColorOptions(Array.isArray(colors) ? colors : []);
      } catch (err) {
        console.error(err);
        setFormError("Erro ao carregar dados: " + err.message);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const parseCurrency = (value) => {
    if (!value) return 0;
    const cleaned = String(value).replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  };

  // onSubmit (UNCHANGED)
  const onSubmit = async (data) => {
    /* ... existing implementation ... */
  };

  // Prepare product names for autocomplete (UNCHANGED)
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

  /**
   * --------------------
   * PRESENTATION LAYER
   * --------------------
   * We switch from ad-hoc flexboxes to MUI Grid so each field gets
   * a predictable span across break-points. All items are full-width
   * **inside** their Grid cell, so labels/inputs stay aligned.
   */

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {/* NAME, GENDER, SIZE */}
          <Grid item xs={12} md={6}>
            {/* Name with Autocomplete */}
            <Controller
              name="name"
              control={control}
              rules={{ required: "Nome é obrigatório" }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error} variant="outlined">
                  {autocompleteError ? (
                    <TextField
                      {...field}
                      label="Nome do Produto"
                      helperText={fieldState.error?.message || " "}
                      disabled={loadingOptions || isProcessing}
                    />
                  ) : (
                    <Autocomplete
                      options={productNames}
                      loading={loadingOptions}
                      freeSolo
                      value={field.value}
                      onChange={(e, v) => field.onChange(typeof v === "string" ? v : v?.label || "")}
                      onInputChange={(e, v) => field.onChange(v)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Nome do Produto"
                          helperText={fieldState.error?.message || " "}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingOptions ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          disabled={loadingOptions || isProcessing}
                        />
                      )}
                    />
                  )}
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            {/* Gender */}
            <Controller
              name="gender"
              control={control}
              rules={{ required: "Sexo é obrigatório" }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel id="gender-label">Sexo</InputLabel>
                  <Select {...field} labelId="gender-label" label="Sexo" disabled={loadingOptions || isProcessing}>
                    <MenuItem value="">
                      <em>Selecione…</em>
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

          <Grid item xs={12} sm={6} md={3}>
            {/* Size */}
            <Controller
              name="size"
              control={control}
              rules={{ required: "Tamanho é obrigatório" }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel id="size-label">Tamanho</InputLabel>
                  <Select {...field} labelId="size-label" label="Tamanho" disabled={loadingOptions || isProcessing}>
                    <MenuItem value="">
                      <em>Selecione…</em>
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

          {/* COLOR / SUPPLIER */}
          <Grid item xs={12} sm={6} md={6}>
            <Controller
              name="colorPrint"
              control={control}
              rules={{ required: "Cor/Estampa é obrigatório" }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel id="color-label">Cor/Estampa</InputLabel>
                  <Select {...field} labelId="color-label" label="Cor/Estampa" disabled={loadingOptions || isProcessing}>
                    <MenuItem value="">
                      <em>Selecione…</em>
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

          <Grid item xs={12} sm={6} md={6}>
            <Controller
              name="supplierId"
              control={control}
              rules={{ required: "Fornecedor é obrigatório" }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error || !!supplierError}>
                  <InputLabel id="supplier-label">Fornecedor</InputLabel>
                  <Select {...field} labelId="supplier-label" label="Fornecedor" disabled={loadingOptions || isProcessing}>
                    <MenuItem value="">
                      <em>Selecione…</em>
                    </MenuItem>
                    {suppliers.map((s) => (
                      <MenuItem key={s.id} value={String(s.id)}>
                        {s.nome}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{fieldState.error?.message || supplierError || " "}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* COST / RETAIL / QUANTITY */}
          <Grid item xs={12} sm={4}>
            <Controller
              name="cost"
              control={control}
              rules={{ required: "Custo é obrigatório" }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <TextField
                    {...field}
                    label="Custo"
                    InputProps={{
                      inputComponent: CurrencyInputAdapter,
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    disabled={loadingOptions || isProcessing}
                    helperText={fieldState.error?.message || " "}
                  />
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="retailPrice"
              control={control}
              rules={{ required: "Preço de venda é obrigatório" }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <TextField
                    {...field}
                    label="Preço de Venda"
                    InputProps={{
                      inputComponent: CurrencyInputAdapter,
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    disabled={loadingOptions || isProcessing}
                    helperText={fieldState.error?.message || " "}
                  />
                </FormControl>
              )}
            />
          </Grid>

          {!isEditMode && (
            <Grid item xs={12} sm={4}>
              <Controller
                name="quantity"
                control={control}
                rules={{ required: "Quantidade é obrigatória", min: { value: 1, message: "Min 1" } }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <TextField
                      {...field}
                      label="Quantidade"
                      type="number"
                      InputProps={{ inputProps: { min: 1 } }}
                      disabled={loadingOptions || isProcessing}
                      helperText={fieldState.error?.message || "Cada unidade será adicionada separadamente"}
                    />
                  </FormControl>
                )}
              />
            </Grid>
          )}

          {/* PURCHASE DATE */}
          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="purchaseDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Data de Compra"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date ? date.format("YYYY-MM-DD") : null)}
                  disabled={loadingOptions || isProcessing}
                  slotProps={{ textField: { fullWidth: true, helperText: " " } }}
                />
              )}
            />
          </Grid>

          {/* FORM-LEVEL ALERTS */}
          {formError && (
            <Grid item xs={12}>
              <Alert severity="error">{formError}</Alert>
            </Grid>
          )}
          {autocompleteError && (
            <Grid item xs={12}>
              <Alert severity="warning">
                Houve um problema com o autocompletar de nomes. Usando campo de texto simples.
              </Alert>
            </Grid>
          )}
          {!isEditMode && (
            <Grid item xs={12}>
              <Alert severity="info">
                Novo paradigma: Cada produto terá quantidade = 1. Se você adicionar um produto com quantidade maior que
                1, serão criadas múltiplas linhas idênticas com quantidade = 1 cada.
              </Alert>
            </Grid>
          )}
          {isEditMode && (
            <Grid item xs={12}>
              <Alert severity="info">
                No modo de edição, a quantidade é sempre 1 por item, seguindo o novo paradigma de estoque.
              </Alert>
            </Grid>
          )}

          {/* ACTIONS */}
          <Grid item xs={12} container justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={isSubmitting || loadingOptions || isProcessing}>
              {isSubmitting || isProcessing ? <CircularProgress size={24} /> : isEditMode ? "Salvar" : "Adicionar Produto"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default ProductForm;
