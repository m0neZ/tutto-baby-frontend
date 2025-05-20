// File: src/pages/EstoquePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MaterialReactTable, { MRT_AggregationFns } from 'material-react-table';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FunctionsIcon from '@mui/icons-material/Functions';
import MovingIcon from '@mui/icons-material/Moving';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddProductModal from '../components/AddProductModal';
import { apiFetch } from '../api';

dayjs.extend(isBetween);

// Formatting helpers
const formatCurrency = v => { /* unchanged */ };
const formatDate = v => { /* unchanged */ };

// Safe aggregation
const safeMean = vals => MRT_AggregationFns.mean(vals.filter(n => typeof n==='number'));
const safeSum = vals => MRT_AggregationFns.sum(vals.filter(n => typeof n==='number'));

function ErrorBoundary({ children }) { /* unchanged */ }

const EstoquePageContent = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ... other state hooks

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/produtos/');
      const list = data.produtos || [];
      const normalized = list.map(p => ({ id: p.id ?? p.id_produto, ...p }));
      setProdutos(normalized);
      setError(null);
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  // Table columns unchanged
  const columns = useMemo(() => [ /* unchanged */ ], [/* dependencies*/]);

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setLoading(true);
    try {
      await apiFetch(`/produtos/${deletingProduct.id}`, { method: 'DELETE' });
      handleCloseConfirmDelete();
      await fetchProdutos();
    } catch (e) {
      setError(`Falha ao excluir produto: ${e.message}`);
      setLoading(false);
    }
  };

  const table = MaterialReactTable.useMaterialReactTable({
    columns,
    data: produtos,
    localization: MRT_Localization_PT_BR,
    enableRowActions: true,
    initialState: { /* unchanged */ },
    state: { isLoading: loading, showAlertBanner: !!error },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button onClick={() => setOpenAddModal(true)}>Adicionar Produto</Button>
        <ToggleButtonGroup /* unchanged */ />
      </Box>
    ),
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 0.1 }}>
        <IconButton onClick={() => handleOpenEditModal(row.original)}><EditIcon/></IconButton>
        <IconButton onClick={() => handleOpenConfirmDelete(row.original)} color="error"><DeleteIcon/></IconButton>
      </Box>
    ),
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>Estoque de produtos</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? <CircularProgress/> : <MaterialReactTable table={table} />}
        <AddProductModal /* unchanged props */ />
        <Dialog /* unchanged delete dialog */ />
      </Container>
    </LocalizationProvider>
  );
};

export default function EstoquePage() {
  return <ErrorBoundary><EstoquePageContent/></ErrorBoundary>;
}
