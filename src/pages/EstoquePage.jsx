import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
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
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FunctionsIcon from '@mui/icons-material/Functions'; // Sum icon
import MovingIcon from '@mui/icons-material/Moving'; // Average icon
import EditIcon from '@mui/icons-material/Edit'; // Edit icon
import DeleteIcon from '@mui/icons-material/Delete'; // Delete icon
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import AddProductModal from '../components/AddProductModal'; // Assuming AddProductModal can handle editing

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
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString("pt-BR");
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
  // State for editing
  const [editingProduct, setEditingProduct] = useState(null); // Store product being edited
  const [openEditModal, setOpenEditModal] = useState(false);
  // State for deletion confirmation
  const [deletingProduct, setDeletingProduct] = useState(null); // Store product being deleted
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
      // ... other columns remain unchanged ...
      { accessorKey: 'nome', header: 'Nome', size: 180, enableGrouping: true },
      { accessorKey: 'sexo', header: 'Sexo', size: 90, enableGrouping: true },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', size: 130, enableGrouping: true },
      { accessorKey: 'tamanho', header: 'Tamanho', size: 100, enableGrouping: true },
      {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        size: 80,
        aggregationFn: 'sum',
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                Total: {cell.getValue()}
            </Box>
        ),
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
      },
      {
        accessorKey: 'custo',
        header: 'Custo',
        size: 110,
        aggregationFn: priceAggregationMode,
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
                {formatCurrency(cell.getValue())}
            </Box>
        ),
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda',
        size: 120,
        aggregationFn: priceAggregationMode,
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                {priceAggregationMode === 'mean' ? 'Média: ' : 'Soma: '}
                {formatCurrency(cell.getValue())}
            </Box>
        ),
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
      },
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', size: 140, enableGrouping: true },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        size: 120,
        Cell: ({ cell }) => formatDate(cell.getValue()),
        filterVariant: 'date-range',
      },
    ],
    [priceAggregationMode],
  );

  // --- Modal Handlers ---
  const handleOpenAddModal = () => {
    setEditingProduct(null); // Ensure we are adding, not editing
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleOpenEditModal = (product) => {
    setEditingProduct(product); // Set the product to edit
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

  // --- Action Handlers ---
  const handleProductAddedOrEdited = async () => {
    handleCloseAddModal();
    handleCloseEditModal();
    try {
      await fetchProdutos(); // Refresh data after adding/editing
    } catch (refreshError) {
      console.error("Error refreshing products:", refreshError);
      setError("Falha ao atualizar a lista de produtos.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setLoading(true); // Indicate loading during delete
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
      // Success
      handleCloseConfirmDelete();
      await fetchProdutos(); // Refresh data
    } catch (e) {
      setError(`Falha ao excluir produto: ${e.message}`);
      console.error("Delete error:", e);
      setLoading(false); // Stop loading indicator on error
    }
    // setLoading(false) is handled in fetchProdutos' finally block if successful
  };

  // --- Aggregation Toggle Handler ---
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
    enableRowActions: true, // Enable row actions
    positionActionsColumn: 'last', // Put actions column at the end
    initialState: {
        density: 'compact',
        sorting: [{ id: 'nome', desc: false }],
        grouping: [],
        pagination: { pageIndex: 0, pageSize: 50 },
        columnPinning: { right: ['mrt-row-actions'] }, // Pin actions column to the right
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
        <Tooltip title="Alternar Agregação de Preços (Média/Soma)">
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
    // Define Row Actions
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
    // Styling props remain unchanged...
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
            '& .Mui-TableHeadCell-Content': {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            },
            '&.MuiTableCell-alignRight .Mui-TableHeadCell-Content': {
                flexDirection: 'row-reverse',
            }
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
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
        Estoque de Produtos
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MaterialReactTable table={table} />
      </LocalizationProvider>

      {/* Add/Edit Modal - Assuming AddProductModal can handle editing via 'initialData' prop */}
      <AddProductModal
        key={editingProduct ? `edit-${editingProduct.id}` : 'add'}
        open={openAddModal || openEditModal}
        onClose={editingProduct ? handleCloseEditModal : handleCloseAddModal}
        onSuccess={handleProductAddedOrEdited}
        initialData={editingProduct} // Pass product data for editing
      />

      {/* Delete Confirmation Dialog */}
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

