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

const ProductForm = ({ onProductAdded, initialData }) => {
  const isEditMode = !!initialData;
  
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
          name: initialData.nome,
          gender: initialData.sexo,
          size: initialData.tamanho,
          colorPrint: initialData.cor_estampa,
          supplierId: String(initialData.fornecedor_id),
          cost: String(initialData.custo),
          retailPrice: String(initialData.preco_venda),
          quantity: String(initialData.quantidade_atual),
          purchaseDate: initialData.data_compra || "",
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
    const cleaned = value.replace(/\./g, "").replace(",", ".");
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

      // Get quantity as integer
      const quantity = parseInt(data.quantity, 10);
      
      if (isEditMode) {
        // Update existing product - keep original quantity for now
        // (Backend will handle the single-unit paradigm)
        const updatePayload = {
          ...basePayload,
          quantidade_atual: quantity
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
    () => Array.isArray(products)
      ? products.map((p) => ({ label: p.nome, id: p.id_produto }))
      : [],
    [products]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}
      >
        {/* NAME, GENDER, SIZE row */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Name with Autocomplete */}
          <Controller
            name="name"
            control={control}
            rules={{ required: "Nome é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth variant="outlined" error={!!fieldState.error}>
                <Autocomplete
                  {...field}
                  options={productNames}
                  getOptionLabel={(o) => o.label || ""}
                  onInputChange={(_, v) => field.onChange(v)}
                  disabled={loadingOptions || isProcessing}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nome do Produto"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || " "}
                    />
                  )}
                />
              </FormControl>
            )}
          />
          {/* Gender */}
          <Controller
            name="gender"
            control={control}
            rules={{ required: "Sexo é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel id="gender-label">Sexo</InputLabel>
                <Select {...field} labelId="gender-label" label="Sexo" disabled={loadingOptions || isProcessing}>
                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Feminino">Feminino</MenuItem>
                  <MenuItem value="Unissex">Unissex</MenuItem>
                </Select>
                <FormHelperText>{fieldState.error?.message || " "}</FormHelperText>
              </FormControl>
            )}
          />
          {/* Size */}
          <Controller
            name="size"
            control={control}
            rules={{ required: "Tamanho é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel id="size-label">Tamanho</InputLabel>
                <Select {...field} labelId="size-label" label="Tamanho" disabled={loadingOptions || isProcessing}>
                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                  {sizeOptions.map((o) => (
                    <MenuItem key={o.id} value={o.value}>{o.value}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{fieldState.error?.message || " "}</FormHelperText>
              </FormControl>
            )}
          />
        </Box>

        {/* COLOR/PRINT + SUPPLIER row */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Color/Print */}
          <Controller
            name="colorPrint"
            control={control}
            rules={{ required: "Cor/Estampa é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel id="color-label">Cor/Estampa</InputLabel>
                <Select {...field} labelId="color-label" label="Cor/Estampa" disabled={loadingOptions || isProcessing}>
                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                  {colorOptions.map((o) => (
                    <MenuItem key={o.id} value={o.value}>{o.value}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{fieldState.error?.message || " "}</FormHelperText>
              </FormControl>
            )}
          />
          {/* Supplier */}
          <Controller
            name="supplierId"
            control={control}
            rules={{ required: "Fornecedor é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error || !!supplierError}>
                <InputLabel id="supplier-label">Fornecedor</InputLabel>
                <Select {...field} labelId="supplier-label" label="Fornecedor" disabled={loadingOptions || isProcessing}>
                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                  {suppliers.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>{s.nome}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{fieldState.error?.message || supplierError || " "}</FormHelperText>
              </FormControl>
            )}
          />
        </Box>

        {/* COST + RETAIL PRICE + QUANTITY row */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Cost */}
          <Controller
            name="cost"
            control={control}
            rules={{ required: "Custo é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <TextField
                  {...field}
                  id="cost-input"
                  label="Custo"
                  InputProps={{
                    inputComponent: CurrencyInputAdapter,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  disabled={loadingOptions || isProcessing}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || " "}
                />
              </FormControl>
            )}
          />
          {/* Retail Price */}
          <Controller
            name="retailPrice"
            control={control}
            rules={{ required: "Preço de venda é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <TextField
                  {...field}
                  id="retail-price-input"
                  label="Preço de Venda"
                  InputProps={{
                    inputComponent: CurrencyInputAdapter,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  disabled={loadingOptions || isProcessing}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || " "}
                />
              </FormControl>
            )}
          />
          {/* Quantity */}
          <Controller
            name="quantity"
            control={control}
            rules={{ 
              required: "Quantidade é obrigatória",
              min: { value: 1, message: "Quantidade mínima é 1" }
            }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <TextField
                  {...field}
                  label="Quantidade"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  disabled={loadingOptions || isProcessing}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || (isEditMode ? " " : "Cada unidade será adicionada como um item separado")}
                />
              </FormControl>
            )}
          />
        </Box>

        {/* PURCHASE DATE row */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Controller
            name="purchaseDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Data de Compra"
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                disabled={loadingOptions || isProcessing}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: " "
                  }
                }}
              />
            )}
          />
        </Box>

        {formError && <Alert severity="error">{formError}</Alert>}

        {!isEditMode && (
          <Alert severity="info">
            Novo paradigma: Cada produto terá quantidade = 1. Se você adicionar um produto com quantidade maior que 1, 
            serão criadas múltiplas linhas idênticas com quantidade = 1 cada.
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || loadingOptions || isProcessing}
          >
            {(isSubmitting || isProcessing) ? <CircularProgress size={24} /> : isEditMode ? "Salvar" : "Adicionar Produto"}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ProductForm;
