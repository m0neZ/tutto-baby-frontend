import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_AggregationFns, // Import aggregation functions
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
  Dialog, // For confirmation dialog
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TableFooter, // Import TableFooter
  TableRow, // Import TableRow
  TableCell, // Import TableCell
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FunctionsIcon from '@mui/icons-material/Functions'; // Sum icon
import MovingIcon from '@mui/icons-material/Moving'; // Average icon
import EditIcon from '@mui/icons-material/Edit'; // Edit icon
import DeleteIcon from '@mui/icons-material/Delete'; // Delete icon
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs'; // Import dayjs for date comparison
import isBetween from 'dayjs/plugin/isBetween'; // Import isBetween plugin
import AddProductModal from '../components/AddProductModal'; // Assuming AddProductModal can handle editing

// Extend dayjs with the plugin *after* all imports
dayjs.extend(isBetween);

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

// Helper functions (formatCurrency, formatDate) remain unchanged...
const formatCurrency = (value) => {
  if (value == null) return 'R$ 0,00';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'R$ -';
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

const formatDate = (value) => {
  if (!value) return '-';
  try {
    // Use dayjs for consistent parsing and formatting
    const date = dayjs(value);
    if (!date.isValid()) return '-';
    // Ensure we display the date as interpreted (likely UTC from backend)
    return date.format('DD/MM/YYYY');
  } catch (e) {
    return '-';
  }
};

// Error Boundary Component (unchanged)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in EstoquePage:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Ocorreu um erro ao renderizar a tabela de estoque. Por favor, atualize a página ou contate o suporte se o problema persistir.
            {this.state.error && <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error.toString()}</pre>}
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
  const [grouping, setGrouping] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [priceAggregationMode, setPriceAggregationMode] = useState('mean');
  const [editingProduct, setEditingProduct] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/produtos/`);
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (jsonError) { /* Ignore */ }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const fetchedProdutos = (data.produtos || (data.success && data.produtos) || []);
      if (fetchedProdutos.length > 0 && fetchedProdutos[0].id === undefined) {
          console.warn("Backend data does not contain 'id' field, attempting to use 'id_produto'.");
          setProdutos(fetchedProdutos.map(p => ({ ...p, id: p.id_produto })));
      } else {
          setProdutos(fetchedProdutos);
      }
      setError(null);
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      console.error("Fetch error:", e);
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
      { accessorKey: 'nome', header: 'Nome', size: 180, enableGrouping: true, muiTableHeadCellProps: { align: 'left' } },
      { accessorKey: 'sexo', header: 'Sexo', size: 90, enableGrouping: true, muiTableHeadCellProps: { align: 'left' } },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', size: 130, enableGrouping: true, muiTableHeadCellProps: { align: 'left' } },
      { accessorKey: 'tamanho', header: 'Tamanho', size: 100, enableGrouping: true, muiTableHeadCellProps: { align: 'left' } },
      {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        size: 80,
        aggregationFn: 'sum', // Always sum quantity
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                Total: {cell.getValue()}
            </Box>
        ),
        // Footer definition for overall aggregation
        Footer: ({ table }) => {
            const total = useMemo(
                () => table.getFilteredRowModel().rows.reduce((sum, row) => sum + row.getValue('quantidade_atual'), 0),
                [table.getFilteredRowModel().rows]
            );
            return (
                <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Total: {total}
                </Box>
            );
        },
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' }, // Align footer cell
      },
      {
        accessorKey: 'custo',
        header: 'Custo Unit.',
        size: 110,
        aggregationFn: priceAggregationMode, // Use state for aggregation
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
                {formatCurrency(cell.getValue())}
            </Box>
        ),
        // Footer definition for overall aggregation
        Footer: ({ table }) => {
            const aggregationFunc = priceAggregationMode === 'mean' ? MRT_AggregationFns.mean : MRT_AggregationFns.sum;
            const value = useMemo(
                () => aggregationFunc(table.getFilteredRowModel().rows.map(row => row.getValue('custo'))),
                [table.getFilteredRowModel().rows, priceAggregationMode]
            );
            return (
                <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
                    {formatCurrency(value)}
                </Box>
            );
        },
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' }, // Align footer cell
      },
      // Removed Custo Total column
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda Unit.',
        size: 120,
        aggregationFn: priceAggregationMode, // Use state for aggregation
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
                {formatCurrency(cell.getValue())}
            </Box>
        ),
        // Footer definition for overall aggregation
        Footer: ({ table }) => {
            const aggregationFunc = priceAggregationMode === 'mean' ? MRT_AggregationFns.mean : MRT_AggregationFns.sum;
            const value = useMemo(
                () => aggregationFunc(table.getFilteredRowModel().rows.map(row => row.getValue('preco_venda'))),
                [table.getFilteredRowModel().rows, priceAggregationMode]
            );
            return (
                <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
                    {formatCurrency(value)}
                </Box>
            );
        },
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' }, // Align footer cell
      },
      // Removed Preço Venda Total column
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', size: 140, enableGrouping: true, muiTableHeadCellProps: { align: 'left' } },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        size: 120,
        Cell: ({ cell }) => formatDate(cell.getValue()),
        filterVariant: 'date-range',
        filterFn: (row, id, filterValue) => {
          const rowDate = dayjs(row.getValue(id));
          const [startDate, endDate] = filterValue;
          if (!rowDate.isValid()) return false;
          const start = startDate ? dayjs(startDate).startOf('day') : null;
          const end = endDate ? dayjs(endDate).endOf('day') : null;
          if (start && end) {
            return rowDate.isBetween(start, end, 'day', '[]');
          } else if (start) {
            return rowDate.isAfter(start, 'day') || rowDate.isSame(start, 'day');
          } else if (end) {
            return rowDate.isBefore(end, 'day') || rowDate.isSame(end, 'day');
          }
          return true;
        },
        muiTableHeadCellProps: { align: 'left' },
      },
    ],
    [priceAggregationMode], // Keep dependency for label and function update
  );

  // --- Modal Handlers (unchanged) ---
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setOpenEditModal(true);
  };
  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEditingProduct(null);
  };

  const handleOpenConfirmDelete = (product) => {
    setDeletingProduct(product);
    setOpenConfirmDelete(true);
  };
  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setDeletingProduct(null);
  };

  // --- Action Handlers (unchanged) ---
  const handleProductAddedOrEdited = async () => {
    handleCloseAddModal();
    handleCloseEditModal();
    try {
      await fetchProdutos();
    } catch (refreshError) {
      console.error("Error refreshing products:", refreshError);
      setError("Falha ao atualizar a lista de produtos.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/produtos/${deletingProduct.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (jsonError) { /* Ignore */ }
        throw new Error(errorMsg);
      }
      handleCloseConfirmDelete();
      await fetchProdutos();
    } catch (e) {
      setError(`Falha ao excluir produto: ${e.message}`);
      console.error("Delete error:", e);
      setLoading(false);
    }
  };

  // --- Aggregation Toggle Handler (unchanged) ---
  const handleAggregationModeChange = (event, newMode) => {
    if (newMode !== null) {
      setPriceAggregationMode(newMode);
    }
  };

  // --- Table Definition ---
  const table = useMaterialReactTable({
    columns,
    data: produtos,
    localization: MRT_Localization_PT_BR,
    enableGrouping: true,
    enableStickyHeader: true,
    enableDensityToggle: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    enableTableFooter: true, // Enable the footer
    initialState: {
        density: 'compact',
        sorting: [{ id: 'nome', desc: false }],
        grouping: [],
        pagination: { pageIndex: 0, pageSize: 50 },
        columnPinning: { right: ['mrt-row-actions'] },
    },
    state: {
        isLoading: loading,
        showAlertBanner: !!error,
        showProgressBars: loading,
        grouping,
        pagination,
    },
    muiToolbarAlertBannerProps: error
      ? {
          color: 'error',
          children: error,
        }
      : undefined,
    onGroupingChange: setGrouping,
    onPaginationChange: setPagination,
    muiTableContainerProps: { sx: { maxHeight: '650px' } },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ textTransform: 'none' }}
          onClick={handleOpenAddModal}
        >
          Adicionar Produto
        </Button>
        <Tooltip title="Alternar Agregação de Preços Unitários (Média/Soma)">
          <ToggleButtonGroup
            value={priceAggregationMode}
            exclusive
            onChange={handleAggregationModeChange}
            aria-label="aggregation mode"
            size="small"
          >
            <ToggleButton value="mean" aria-label="average">
              <MovingIcon fontSize="small" /> Média
            </ToggleButton>
            <ToggleButton value="sum" aria-label="sum">
              <FunctionsIcon fontSize="small" /> Soma
            </ToggleButton>
          </ToggleButtonGroup>
        </Tooltip>
      </Box>
    ),
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '0.1rem', justifyContent: 'center' }}>
        <Tooltip title="Editar">
          <IconButton size="small" onClick={() => handleOpenEditModal(row.original)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton size="small" color="error" onClick={() => handleOpenConfirmDelete(row.original)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    muiTablePaperProps: {
        elevation: 1,
        sx: {
            borderRadius: '0',
            border: '1px solid',
            borderColor: 'divider',
        },
    },
    muiTableHeadCellProps: {
        sx: (theme) => ({
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            fontWeight: 'bold',
        }),
    },
    muiTableBodyProps: {
        sx: (theme) => ({
            '& tr:nth-of-type(odd) > td': {
                backgroundColor: theme.palette.background.paper,
            },
            '& tr:nth-of-type(even) > td': {
                backgroundColor: theme.palette.action.hover,
            },
        }),
    },
    // Style the footer row
    muiTableFooterProps: {
        sx: (theme) => ({
            backgroundColor: theme.palette.grey[200], // Example footer background
            '& td': {
                fontWeight: 'bold',
            }
        }),
    },
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
        Estoque de Produtos
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MaterialReactTable table={table} />
      </LocalizationProvider>

      <AddProductModal
        key={editingProduct ? `edit-${editingProduct.id}` : 'add'}
        open={openAddModal || openEditModal}
        onClose={editingProduct ? handleCloseEditModal : handleCloseAddModal}
        onSuccess={handleProductAddedOrEdited}
        initialData={editingProduct}
      />

      <Dialog
        open={openConfirmDelete}
        onClose={handleCloseConfirmDelete}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o produto "{deletingProduct?.nome}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDelete}>Cancelar</Button>
          <Button onClick={handleDeleteProduct} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

const EstoquePage = () => (
  <ErrorBoundary>
    <EstoquePageContent />
  </ErrorBoundary>
);

export default EstoquePage;

