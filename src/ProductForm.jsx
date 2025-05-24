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
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
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
          quantity: "1", // Always set to 1 for edit mode
          purchaseDate: initialData.data_compra || dayjs().format('YYYY-MM-DD'),
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
          purchaseDate: dayjs().format('YYYY-MM-DD'),
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
    return () => { isMounted = false; };
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
        // Update existing product - always keep quantity=1 for single-unit paradigm
        const updatePayload = {
          ...basePayload,
          quantidade_atual: 1 // Force quantity=1 for edit mode
        };
        
        const res = await authFetch(`/produtos/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload)
        });
        
        if (res.success) {
          reset();
          onProductAdded();
        } else {
          setFormError(res.error || "Falha ao atualizar produto.");
        }
      } else {
        // Create new product(s) - implement single-unit paradigm
        // For each quantity, create a separate product with quantity=1
        const quantity = parseInt(data.quantity, 10) || 1;
        const createPromises = [];
        
        // Single-unit paradigm: Create multiple rows with quantity=1
        for (let i = 0; i < quantity; i++) {
          const singleUnitPayload = {
            ...basePayload,
            quantidade_atual: 1
          };
          
          createPromises.push(createProduct(singleUnitPayload));
        }
        
        // Wait for all products to be created
        const results = await Promise.all(createPromises);
        
        // Check if any creation failed
        const failures = results.filter(res => !res.success);
        
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

  // Prepare product names for auto-complete
  const productNames = useMemo(
    () => {
      try {
        return Array.isArray(products)
          ? [...new Set(products.map(p => p.nome))]
              .filter(Boolean)
              .map(name => ({ label: name }))
          : [];
      } catch (err) {
        console.error("Error preparing product names:", err);
        setAutocompleteError(true);
        return [];
      }
    },
    [products]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        {/* First Row: Name and Gender */}
        <Box sx={{ 
          display: "grid", 
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, 
          gap: 2 
        }}>
          {/* Name with Autocomplete */}
          <Controller
            name="name"
            control={control}
            rules={{ required: "Nome é obrigatório" }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Nome do Produto <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {autocompleteError ? (
                  // Fallback to regular TextField if autocomplete has errors
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Autocomplete indisponível"}
                    disabled={loadingOptions || isProcessing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#3b82f6' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                      }
                    }}
                  />
                ) : (
                  <Autocomplete
                    options={productNames}
                    loading={loadingOptions}
                    disabled={loadingOptions || isProcessing}
                    freeSolo
                    value={field.value}
                    onChange={(event, newValue) => {
                      try {
                        field.onChange(typeof newValue === 'string' ? newValue : newValue?.label || '');
                      } catch (err) {
                        console.error("Error in autocomplete onChange:", err);
                        field.onChange(field.value); // Keep current value on error
                        setAutocompleteError(true);
                      }
                    }}
                    onInputChange={(event, newInputValue) => {
                      try {
                        field.onChange(newInputValue);
                      } catch (err) {
                        console.error("Error in autocomplete onInputChange:", err);
                        setAutocompleteError(true);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#3b82f6' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          }
                        }}
                      />
                    )}
                  />
                )}
              </Box>
            )}
          />

          {/* Gender */}
          <Controller
            name="gender"
            control={control}
            rules={{ required: "Sexo é obrigatório" }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Sexo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <FormControl fullWidth error={!!fieldState.error}>
                  <Select 
                    {...field} 
                    disabled={loadingOptions || isProcessing}
                    sx={{
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    }}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    <MenuItem value="Masculino">Masculino</MenuItem>
                    <MenuItem value="Feminino">Feminino</MenuItem>
                    <MenuItem value="Unissex">Unissex</MenuItem>
                  </Select>
                  {fieldState.error && (
                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            )}
          />
        </Box>

        {/* Second Row: Size and Color/Print */}
        <Box sx={{ 
          display: "grid", 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 2 
        }}>
          {/* Size */}
          <Controller
            name="size"
            control={control}
            rules={{ required: "Tamanho é obrigatório" }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Tamanho <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <FormControl fullWidth error={!!fieldState.error}>
                  <Select 
                    {...field} 
                    disabled={loadingOptions || isProcessing}
                    sx={{
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    }}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {sizeOptions.map((o) => (
                      <MenuItem key={o.id} value={o.value}>{o.value}</MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            )}
          />

          {/* Color/Print */}
          <Controller
            name="colorPrint"
            control={control}
            rules={{ required: "Cor/Estampa é obrigatório" }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Cor/Estampa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <FormControl fullWidth error={!!fieldState.error}>
                  <Select 
                    {...field} 
                    disabled={loadingOptions || isProcessing}
                    sx={{
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    }}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {colorOptions.map((o) => (
                      <MenuItem key={o.id} value={o.value}>{o.value}</MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            )}
          />
        </Box>

        {/* Third Row: Supplier and Purchase Date */}
        <Box sx={{ 
          display: "grid", 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 2 
        }}>
          {/* Supplier */}
          <Controller
            name="supplierId"
            control={control}
            rules={{ required: "Fornecedor é obrigatório" }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Fornecedor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <FormControl fullWidth error={!!fieldState.error || !!supplierError}>
                  <Select 
                    {...field} 
                    disabled={loadingOptions || isProcessing}
                    sx={{
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    }}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.nome}
                      </MenuItem>
                    ))}
                  </Select>
                  {(fieldState.error || supplierError) && (
                    <FormHelperText>{fieldState.error?.message || supplierError}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            )}
          />

          {/* Purchase Date */}
          <Controller
            name="purchaseDate"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Data de Compra
                </label>
                <DatePicker
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                  disabled={loadingOptions || isProcessing}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#3b82f6' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                        }
                      }
                    }
                  }}
                />
              </Box>
            )}
          />
        </Box>

        {/* Fourth Row: Cost, Retail Price, and Quantity */}
        <Box sx={{ 
          display: "grid", 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, 
          gap: 2 
        }}>
          {/* Cost */}
          <Controller
            name="cost"
            control={control}
            rules={{ required: "Custo é obrigatório" }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Custo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={loadingOptions || isProcessing}
                  InputProps={{
                    inputComponent: CurrencyInputAdapter,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#3b82f6' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    }
                  }}
                />
              </Box>
            )}
          />

          {/* Retail Price */}
          <Controller
            name="retailPrice"
            control={control}
            rules={{ required: "Preço de venda é obrigatório" }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Preço de Venda <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={loadingOptions || isProcessing}
                  InputProps={{
                    inputComponent: CurrencyInputAdapter,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#3b82f6' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    }
                  }}
                />
              </Box>
            )}
          />

          {/* Quantity */}
          <Controller
            name="quantity"
            control={control}
            rules={{ 
              required: "Quantidade é obrigatória",
              min: { value: 1, message: "Mínimo de 1" },
              pattern: { value: /^[0-9]+$/, message: "Apenas números" }
            }}
            render={({ field, fieldState }) => (
              <Box>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Quantidade <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  type="number"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={isEditMode || loadingOptions || isProcessing}
                  InputProps={{ inputProps: { min: 1 } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#3b82f6' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    }
                  }}
                />
                <FormHelperText>
                  Cada unidade será adicionada como um item separado
                </FormHelperText>
              </Box>
            )}
          />
        </Box>

        {/* Info Alert */}
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ borderRadius: '8px' }}>
            Novo paradigma: Cada produto terá quantidade = 1. Se você adicionar um produto com quantidade maior que 1, serão criadas múltiplas linhas idênticas com quantidade = 1 cada.
          </Alert>
        </Box>

        {/* Error Message */}
        {formError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
            {formError}
          </Alert>
        )}

        {/* Form Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => onProductAdded()}
            disabled={isProcessing}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            CANCELAR
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="accent"
            disabled={isProcessing}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: theme.palette.accent.main,
              '&:hover': {
                backgroundColor: theme.palette.accent.dark,
              }
            }}
          >
            {isProcessing ? (
              <CircularProgress size={24} color="inherit" />
            ) : isEditMode ? (
              "ATUALIZAR PRODUTO"
            ) : (
              "ADICIONAR PRODUTO"
            )}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ProductForm;
