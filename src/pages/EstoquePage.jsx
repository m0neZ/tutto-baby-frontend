import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { Box, Button, Container, Typography, CircularProgress, Alert } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR'; // Import MRT localization

import AddProductModal from '../components/AddProductModal';

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

// Helper function to format currency (unchanged)
const formatCurrency = (value) => {
  if (value == null) return 'R$ 0,00';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'R$ -';
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

// Helper function to format date (unchanged)
const formatDate = (value) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    // Ensure UTC date is interpreted correctly for display
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
  const [grouping, setGrouping] = useState([]); // State for grouping
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 }); // Control pagination

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
      // MRT uses the data directly, no need to map 'id' if 'id' exists in the data
      const fetchedProdutos = (data.produtos || (data.success && data.produtos) || []);
      // Ensure 'id' exists, otherwise MRT might complain
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
      { accessorKey: 'nome', header: 'Nome', size: 180, enableGrouping: true }, // Enable grouping for these columns
      { accessorKey: 'sexo', header: 'Sexo', size: 90, enableGrouping: true },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', size: 130, enableGrouping: true },
      { accessorKey: 'tamanho', header: 'Tamanho', size: 100, enableGrouping: true },
      {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        size: 80,
        aggregationFn: 'sum', // Enable aggregation
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
        aggregationFn: 'mean', // Default to average, can add toggle later if needed
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                Média: {formatCurrency(cell.getValue())}
            </Box>
        ),
        Cell: ({ cell }) => formatCurrency(cell.getValue()), // Format in regular cells
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda',
        size: 120,
        aggregationFn: 'mean', // Default to average
        AggregatedCell: ({ cell }) => (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                Média: {formatCurrency(cell.getValue())}
            </Box>
        ),
        Cell: ({ cell }) => formatCurrency(cell.getValue()), // Format in regular cells
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
      },
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', size: 140, enableGrouping: true },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        size: 120,
        Cell: ({ cell }) => formatDate(cell.getValue()), // Format date
        filterVariant: 'date-range', // Enable date range filtering
      },
    ],
    [],
  );

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleProductAdded = async () => {
    handleCloseAddModal();
    try {
      await fetchProdutos();
    } catch (refreshError) {
      console.error("Error refreshing products after add:", refreshError);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: produtos, // Pass fetched data
    localization: MRT_Localization_PT_BR, // Apply localization
    enableGrouping: true,
    enableStickyHeader: true,
    enableDensityToggle: false,
    initialState: {
        density: 'compact',
        sorting: [{ id: 'nome', desc: false }], // Initial sort
        grouping: [], // Initial grouping state
        pagination: { pageIndex: 0, pageSize: 50 },
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
    onGroupingChange: setGrouping, // Control grouping state
    onPaginationChange: setPagination, // Control pagination state
    muiTableContainerProps: { sx: { maxHeight: '650px' } }, // Set max height for scroll
    renderTopToolbarCustomActions: () => (
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ textTransform: 'none' }}
          onClick={handleOpenAddModal}
        >
          Adicionar Produto
        </Button>
    ),
    // Styling
    muiTablePaperProps: {
        elevation: 1, // Optional: add slight shadow
        sx: {
            borderRadius: '0',
            border: '1px solid',
            borderColor: 'divider',
        },
    },
    muiTableHeadCellProps: {
        sx: (theme) => ({
            backgroundColor: theme.palette.secondary.main, // Pink header
            color: theme.palette.secondary.contrastText,
            fontWeight: 'bold',
        }),
    },
    muiTableBodyProps: {
        sx: (theme) => ({
            '& tr:nth-of-type(odd) > td': {
                backgroundColor: theme.palette.background.paper, // White background for odd rows
            },
            '& tr:nth-of-type(even) > td': {
                backgroundColor: theme.palette.action.hover, // Slightly off-white for even rows (optional zebra striping)
            },
        }),
    },
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
        Estoque de Produtos
      </Typography>

      {/* Render the table */} 
      <MaterialReactTable table={table} />

      <AddProductModal
        open={openAddModal}
        onClose={handleCloseAddModal}
        onSuccess={handleProductAdded}
      />
    </Container>
  );
};

// Wrap the main content with the Error Boundary
const EstoquePage = () => (
  <ErrorBoundary>
    <EstoquePageContent />
  </ErrorBoundary>
);

export default EstoquePage;

