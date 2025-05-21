// src/pages/EstoquePage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_AggregationFns,
} from 'material-react-table';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
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
import { authFetch } from '../api';

dayjs.extend(isBetween);

// Formatting helpers
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

// Aggregation wrappers
const safeSum = (vals) =>
  MRT_AggregationFns.sum(vals.filter((n) => typeof n === 'number' && !isNaN(n)));
const safeMean = (vals) =>
  MRT_AggregationFns.mean(vals.filter((n) => typeof n === 'number' && !isNaN(n)));

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Uncaught error in EstoquePage:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Ocorreu um erro ao renderizar a tabela de estoque.
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error.toString()}
            </pre>
          </Alert>
        </Container>
      );
    }
    return this.props.children;
  }
}

// Main content
const EstoquePageContent = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [grouping, setGrouping] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [priceAggregationMode, setPriceAggregationMode] = useState('mean');

  // Fetch products
  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/produtos/');
      const list = res.produtos || [];
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

  // Columns definition
  const columns = useMemo(
    () => [
      { accessorKey: 'nome', header: 'Nome', enableGrouping: true },
      { accessorKey: 'sexo', header: 'Sexo', enableGrouping: true },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', enableGrouping: true },
      { accessorKey: 'tamanho', header: 'Tamanho', enableGrouping: true },
      {
        accessorKey: 'quantidade_atual', header: 'Qtd.', aggregationFn: safeSum,
        Cell: ({ cell }) => cell.getValue(),
        AggregatedCell: ({ cell }) => <strong>Total: {cell.getValue()}</strong>,
        Footer: ({ table }) => {
          const total = table.getFilteredRowModel().rows.reduce(
            (sum, row) => sum + (row.getValue('quantidade_atual') || 0),
            0
          );
          return <strong>Total: {total}</strong>;
        },
      },
      {
        accessorKey: 'custo', header: 'Custo Unit.', aggregationFn: priceAggregationMode === 'mean' ? safeMean : safeSum,
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <strong>
            {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </strong>
        ),
        Footer: ({ table }) => {
          const vals = table.getFilteredRowModel().rows.map((r) => r.getValue('custo') || 0);
          const val = priceAggregationMode === 'mean' ? safeMean(vals) : safeSum(vals);
          return <strong>{priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}{formatCurrency(val)}</strong>;
        },
      },
      {
        accessorKey: 'preco_venda', header: 'Preço Venda Unit.', aggregationFn: priceAggregationMode === 'mean' ? safeMean : safeSum,
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <strong>
            {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </strong>
        ),
        Footer: ({ table }) => {
          const vals = table.getFilteredRowModel().rows.map((r) => r.getValue('preco_venda') || 0);
          const val = priceAggregationMode === 'mean' ? safeMean(vals) : safeSum(vals);
          return <strong>{priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}{formatCurrency(val)}</strong>;
        },
      },
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', enableGrouping: true },
      {
        accessorKey: 'data_compra', header: 'Data Compra',
        Cell: ({ cell }) => formatDate(cell.getValue()),
        filterVariant: 'date-range',
        filterFn: (row, id, filter) => {
          const date = dayjs(row.getValue(id));
          const [start, end] = filter;
          if (start && end) {
            return date.isBetween(dayjs(start).startOf('day'), dayjs(end).endOf('day'), 'day', '[]');
          } else if (start) {
            return date.isSameOrAfter(dayjs(start).startOf('day')); }
          else if (end) {
            return date.isSameOrBefore(dayjs(end).endOf('day')); }
          return true;
        },
      },
    ],
    [priceAggregationMode]
  );

  // Table instance
  const table = useMaterialReactTable({
    columns,
    data: produtos,
    localization: MRT_Localization_PT_BR,
    enableGrouping: true,
    enableStickyHeader: true,
    enableDensityToggle: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    enableTableFooter: true,
    initialState: { grouping, pagination },
    state: { isLoading: loading, showAlertBanner: !!error, grouping, pagination },
    onGroupingChange: setGrouping,
    onPaginationChange: setPagination,
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => { setEditingProduct(null); setOpenAddModal(true); }}
        >
          Adicionar Produto
        </Button>
        <ToggleButtonGroup
          value={priceAggregationMode}
          exclusive
          onChange={(_, v) => v && setPriceAggregationMode(v)}
        >
          <ToggleButton value="mean">Média</ToggleButton>
          <ToggleButton value="sum">Soma</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    ),
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Editar">
          <IconButton onClick={() => { setEditingProduct(row.original); setOpenEditModal(true); }}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton color="error" onClick={() => setOpenConfirmDelete(true)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Estoque de produtos
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MaterialReactTable table={table} />
        </LocalizationProvider>
      )}

      <AddProductModal
        open={openAddModal || openEditModal}
        onClose={() => { openEditModal ? setOpenEditModal(false) : setOpenAddModal(false); }}
        onSuccess={() => { fetchProdutos(); setOpenAddModal(false); setOpenEditModal(false); }}
        productData={editingProduct}
        isEditMode={!!editingProduct}
      />

      <Dialog open={openConfirmDelete} onClose={() => setOpenConfirmDelete(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir "{deletingProduct?.nome}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDelete(false)}>Cancelar</Button>
          <Button
            color="error"
            onClick={async () => {
              await apiFetch(`/produtos/${deletingProduct.id}`, { method: 'DELETE' });
              fetchProdutos();
              setOpenConfirmDelete(false);
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default function EstoquePage() {
  return (
    <ErrorBoundary>
      <EstoquePageContent />
    </ErrorBoundary>
  );
}
