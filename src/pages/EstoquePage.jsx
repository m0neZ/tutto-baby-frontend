// src/pages/EstoquePage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  MRT_AggregationFns,
  useMaterialReactTable,
  MRT_Localization_PT_BR,
} from 'material-react-table';
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
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddProductModal from '../components/AddProductModal';
import { apiFetch } from '../api';

dayjs.extend(isBetween);

// Helpers
const formatCurrency = (value) => {
  if (value == null) return 'R$ 0,00';
  const num = Number(value);
  if (isNaN(num)) return 'R$ -';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};
const formatDate = (value) => {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD/MM/YYYY') : '-';
};
const safeMean = (vals) =>
  MRT_AggregationFns.mean(vals.filter((n) => typeof n === 'number'));
const safeSum = (vals) =>
  MRT_AggregationFns.sum(vals.filter((n) => typeof n === 'number'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Error in EstoquePage:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Erro ao renderizar Estoque. {this.state.error.toString()}
          </Alert>
        </Container>
      );
    }
    return this.props.children;
  }
}

const EstoquePageContent = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [priceAggregationMode, setPriceAggregationMode] = useState('mean');

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/produtos/');
      const list = data.produtos || [];
      setProdutos(list.map((p) => ({ id: p.id ?? p.id_produto, ...p })));
      setError(null);
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const columns = useMemo(
    () => [
      { accessorKey: 'nome', header: 'Nome', enableGrouping: true },
      { accessorKey: 'sexo', header: 'Sexo', enableGrouping: true },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', enableGrouping: true },
      { accessorKey: 'tamanho', header: 'Tamanho', enableGrouping: true },
      {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        aggregationFn: safeSum,
        AggregatedCell: ({ cell }) => <>Total: {cell.getValue()}</>,
        Footer: ({ table }) => {
          const total = safeSum(
            table
              .getFilteredRowModel()
              .rows.map((r) => r.getValue('quantidade_atual'))
          );
          return <>Total: {total}</>;
        },
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
      },
      {
        accessorKey: 'custo',
        header: 'Custo Unit.',
        aggregationFn: priceAggregationMode === 'mean' ? safeMean : safeSum,
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <>
            {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </>
        ),
        Footer: ({ table }) => {
          const vals = table
            .getFilteredRowModel()
            .rows.map((r) => r.getValue('custo'));
          const value =
            priceAggregationMode === 'mean' ? safeMean(vals) : safeSum(vals);
          return (
            <>
              {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
              {formatCurrency(value)}
            </>
          );
        },
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda Unit.',
        aggregationFn: priceAggregationMode === 'mean' ? safeMean : safeSum,
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <>
            {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </>
        ),
        Footer: ({ table }) => {
          const vals = table
            .getFilteredRowModel()
            .rows.map((r) => r.getValue('preco_venda'));
          const value =
            priceAggregationMode === 'mean' ? safeMean(vals) : safeSum(vals);
          return (
            <>
              {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
              {formatCurrency(value)}
            </>
          );
        },
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
      },
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', enableGrouping: true },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        Cell: ({ cell }) => formatDate(cell.getValue()),
        filterVariant: 'date-range',
        filterFn: (row, id, filterValue) => {
          const date = dayjs(row.getValue(id));
          const [start, end] = filterValue;
          return (
            (!start || date.isAfter(dayjs(start).startOf('day'))) &&
            (!end || date.isBefore(dayjs(end).endOf('day')))
          );
        },
      },
    ],
    [priceAggregationMode]
  );

  const table = useMaterialReactTable({
    columns,
    data: produtos,
    localization: MRT_Localization_PT_BR,
    enableRowActions: true,
    state: { isLoading: loading, showAlertBanner: !!error },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            setEditingProduct(null);
            setOpenAddModal(true);
          }}
        >
          Adicionar Produto
        </Button>
        <ToggleButtonGroup
          value={priceAggregationMode}
          exclusive
          onChange={(_, val) => val && setPriceAggregationMode(val)}
        >
          <ToggleButton value="mean">
            <MovingIcon /> Média
          </ToggleButton>
          <ToggleButton value="sum">
            <FunctionsIcon /> Soma
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    ),
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton onClick={() => {
            setEditingProduct(row.original);
            setOpenEditModal(true);
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          color="error"
          onClick={() => {
            setDeletingProduct(row.original);
            setOpenConfirmDelete(true);
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    ),
  });

  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      await apiFetch(`/produtos/${deletingProduct.id}`, { method: 'DELETE' });
      setOpenConfirmDelete(false);
      await fetchProdutos();
    } catch (e) {
      setError(`Falha ao excluir produto: ${e.message}`);
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Estoque de produtos
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <CircularProgress />
        ) : (
          <MaterialReactTable table={table} />
        )}
        <AddProductModal
          open={openAddModal || openEditModal}
          onClose={() => {
            setOpenAddModal(false);
            setOpenEditModal(false);
          }}
          onSuccess={fetchProdutos}
          productData={editingProduct}
          isEditMode={!!editingProduct}
        />
        <Dialog open={openConfirmDelete} onClose={() => setOpenConfirmDelete(false)}>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Deseja excluir "{deletingProduct?.nome}"?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDelete(false)}>Cancelar</Button>
            <Button onClick={handleDeleteProduct} color="error">
              Excluir
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default function EstoquePage() {
  return (
    <ErrorBoundary>
      <EstoquePageContent />
    </ErrorBoundary>
  );
}
