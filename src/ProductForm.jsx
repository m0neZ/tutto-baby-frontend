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
    const payload = {
      nome: data.name.trim(),
      sexo: data.gender,
      tamanho: data.size,
      cor_estampa: data.colorPrint,
      fornecedor_id: parseInt(data.supplierId, 10),
      custo: parseCurrency(data.cost),
      preco_venda: parseCurrency(data.retailPrice),
      quantidade_atual: parseInt(data.quantity, 10),
      data_compra: data.purchaseDate || null,
    };

    try {
      let res;
      if (isEditMode) {
        // Update existing product
        res = await authFetch(`/produtos/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        // Create new product
        res = await createProduct(payload);
      }
      
      if (res.success) {
        reset();
        onProductAdded();
      } else {
        setFormError(res.error || `Falha ao ${isEditMode ? 'atualizar' : 'adicionar'} produto.`);
      }
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Erro ao enviar formulário.");
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
              <Autocomplete
                {...field}
                options={productNames}
                getOptionLabel={(o) => o.label || ""}
                onInputChange={(_, v) => field.onChange(v)}
                disabled={loadingOptions}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nome do Produto"
                    fullWidth
                    variant="standard"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || " "}
                  />
                )}
              />
            )}
          />
          {/* Gender */}
          <Controller
            name="gender"
            control={control}
            rules={{ required: "Sexo é obrigatório" }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth variant="standard" error={!!fieldState.error}>
                <InputLabel id="gender-label">Sexo</InputLabel>
                <Select {...field} labelId="gender-label" disabled={loadingOptions}>
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
              <FormControl fullWidth variant="standard" error={!!fieldState.error}>
                <InputLabel id="size-label">Tamanho</InputLabel>
                <Select {...field} labelId="size-label" disabled={loadingOptions}>
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
              <FormControl fullWidth variant="standard" error={!!fieldState.error}>
                <InputLabel id="color-label">Cor/Estampa</InputLabel>
                <Select {...field} labelId="color-label" disabled={loadingOptions}>
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
              <FormControl fullWidth variant="standard" error={!!fieldState.error || !!supplierError}>
                <InputLabel id="supplier-label">Fornecedor</InputLabel>
                <Select {...field} labelId="supplier-label" disabled={loadingOptions}>
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
              <FormControl fullWidth variant="standard" error={!!fieldState.error}>
                <InputLabel htmlFor="cost-input">Custo</InputLabel>
                <TextField
                  {...field}
                  id="cost-input"
                  variant="standard"
                  InputProps={{
                    inputComponent: CurrencyInputAdapter,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
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
              <FormControl fullWidth variant="standard" error={!!fieldState.error}>
                <InputLabel htmlFor="retail-price-input">Preço de Venda</InputLabel>
                <TextField
                  {...field}
                  id="retail-price-input"
                  variant="standard"
                  InputProps={{
                    inputComponent: CurrencyInputAdapter,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
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
              <TextField
                {...field}
                label="Quantidade"
                type="number"
                variant="standard"
                fullWidth
                InputProps={{ inputProps: { min: 1 } }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message || " "}
              />
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
                slotProps={{
                  textField: {
                    variant: "standard",
                    fullWidth: true,
                    helperText: " "
                  }
                }}
              />
            )}
          />
        </Box>

        {formError && <Alert severity="error">{formError}</Alert>}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || loadingOptions}
          >
            {isSubmitting ? <CircularProgress size={24} /> : isEditMode ? "Salvar" : "Adicionar Produto"}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ProductForm;
