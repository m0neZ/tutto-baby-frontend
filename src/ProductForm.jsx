// src/ProductForm.jsx
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

// Adapter component
const CurrencyInputAdapter = forwardRef(function CurrencyInputAdapter(
  props,
  ref
) {
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

const ProductForm = ({ initialData, onSubmit }) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    watch,
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

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingOptions(true);
      try {
        // Load suppliers
        try {
          const supList = await fetchSuppliers();
          if (isMounted) {
            setSuppliers(Array.isArray(supList) ? supList : []);
            if (!Array.isArray(supList) || supList.length === 0) {
              setSupplierError("Nenhum fornecedor ativo encontrado.");
            }
          }
        } catch (e) {
          if (isMounted) {
            setSuppliers([]);
            setSupplierError(`Erro ao carregar fornecedores: ${e.message}`);
          }
        }
        // Load products, sizes, colors
        const [prodList, szOpts, clrOpts] = await Promise.all([
          fetchProducts(),
          fetchFieldOptions("tamanho"),
          fetchFieldOptions("cor_estampa"),
        ]);
        if (isMounted) {
          setProducts(Array.isArray(prodList) ? prodList : []);
          setSizeOptions(Array.isArray(szOpts) ? szOpts : []);
          setColorOptions(Array.isArray(clrOpts) ? clrOpts : []);
        }
      } catch (e) {
        if (isMounted && !supplierError) {
          setFormError(`Erro ao carregar dados: ${e.message}`);
        }
      } finally {
        isMounted && setLoadingOptions(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const onSubmitForm = async (data) => {
    setFormError("");
    setFormSuccess("");

    const parseCurrency = (v) =>
      parseFloat(v.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".")) || NaN;
    const cost = parseCurrency(data.cost);
    const price = parseCurrency(data.retailPrice);
    const qty = parseInt(data.quantity, 10);
    const supId = parseInt(data.supplierId, 10);
    const invalid = [];
    if (isNaN(supId)) invalid.push("Fornecedor");
    if (isNaN(cost)) invalid.push("Custo");
    if (isNaN(price)) invalid.push("Preço Venda");
    if (isNaN(qty)) invalid.push("Quantidade");
    if (invalid.length) {
      setFormError(`Valores inválidos em: ${invalid.join(", ")}.`);
      return;
    }

    try {
      await createProduct({
        nome: data.name.trim(),
        sexo: data.gender,
        tamanho: data.size,
        cor_estampa: data.colorPrint,
        fornecedor_id: supId,
        custo: cost,
        preco_venda: price,
        quantidade_atual: qty,
        data_compra: data.purchaseDate || null,
      });
      setFormSuccess("Produto adicionado com sucesso!");
      reset();
      onSubmit?.();
    } catch (e) {
      console.error(e);
      setFormError(e.message || "Erro ao enviar formulário.");
    }
  };

  const productNames = useMemo(
    () => products.map((p) => ({ label: p.nome, id: p.id_produto })),
    [products]
  );

  const isSupplierDisabled = loadingOptions || !!supplierError || suppliers.length === 0;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmitForm)}
      sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {/* ...form fields layout as before, using Controller and CurrencyInputAdapter... */}
      {/* Submit */}
      {formError && <Alert severity="error">{formError}</Alert>}
      {formSuccess && <Alert severity="success">{formSuccess}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" disabled={isSubmitting || loadingOptions}>
          {isSubmitting ? <CircularProgress size={24} /> : "Salvar"}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductForm;
