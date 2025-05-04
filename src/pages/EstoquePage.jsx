import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';

import AddProductModal from '../components/AddProductModal';

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

// Helper function to format currency
const formatCurrency = (value) => {
  if (value == null) return 'R$ 0,00';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'R$ -';
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

// Helper function to format date
const formatDate = (value) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
  } catch (e) {
    return '-';
  }
};

// Error Boundary Component (Simple version)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in EstoquePage:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
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

  const fetchProdutos = useCallback(async () => {
    // Reset error before fetching
    // setError(null); // Keep previous error visible until loading finishes? Maybe not.
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
      const fetchedProdutos = (data.produtos || (data.success && data.produtos) || []).map(p => ({ ...p, id: p.id_produto }));
      setProdutos(fetchedProdutos);
      setError(null); // Clear error on success
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      console.error("Fetch error:", e);
      setProdutos([]); // Clear products on error to avoid rendering stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const columns = [
    { field: 'nome', headerName: 'Nome', flex: 1.5, minWidth: 180 },
    { field: 'sexo', headerName: 'Sexo', width: 90 },
    { field: 'cor_estampa', headerName: 'Cor/Estampa', flex: 1, minWidth: 130 },
    { field: 'tamanho', headerName: 'Tamanho', width: 100 },
    {
      field: 'quantidade_atual',
      headerName: 'Qtd.',
      type: 'number',
      width: 80,
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'custo',
      headerName: 'Custo',
      type: 'number',
      width: 110,
      valueFormatter: (value) => formatCurrency(value),
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'preco_venda',
      headerName: 'Preço Venda',
      type: 'number',
      width: 120,
      valueFormatter: (value) => formatCurrency(value),
      align: 'right',
      headerAlign: 'right'
    },
    { field: 'nome_fornecedor', headerName: 'Fornecedor', flex: 1, minWidth: 140 },
    {
      field: 'data_compra',
      headerName: 'Data Compra',
      type: 'date',
      width: 120,
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value) => formatDate(value)
    },
  ];

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);

  // Wrap fetchProdutos in try-catch inside the handler to prevent crashes
  const handleProductAdded = async () => {
    handleCloseAddModal();
    try {
      await fetchProdutos(); // Refresh data after adding
    } catch (refreshError) {
      // Error during refresh is already handled within fetchProdutos and sets the error state
      console.error("Error refreshing products after add:", refreshError);
      // Optionally set a specific error message for refresh failure
      // setError("Falha ao atualizar a lista de produtos após adição.");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Estoque de Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ textTransform: 'none' }}
          onClick={handleOpenAddModal}
        >
          Adicionar Produto
        </Button>
      </Box>

      {/* Display error prominently if it occurs */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      <Box sx={{ height: 650, width: '100%' }}>
        {/* Show loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
        {/* Only render DataGrid if not loading AND no critical error occurred (error state is set) */}
        {/* If fetch fails, error is set, and products might be empty, preventing render errors */}
        {!loading && (
          <DataGrid
            rows={produtos} // Use potentially empty products array if fetch failed
            columns={columns}
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            initialState={{
              sorting: {
                sortModel: [{ field: 'nome', sort: 'asc' }],
              },
              pagination: {
                  paginationModel: { page: 0, pageSize: 100 },
              },
              filter: {
                filterModel: {
                  items: [],
                },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            density="compact"
            sx={{
               boxShadow: 1,
               border: '1px solid',
               borderColor: 'divider',
               '& .MuiDataGrid-columnHeader': {
                  // *** FIX: Use secondary color for header background ***
                  backgroundColor: 'secondary.main', 
                  color: 'secondary.contrastText', // Ensure text color contrasts with pink
                  fontWeight: 'bold',
               },
               '& .MuiDataGrid-columnHeaderTitleContainer': {
                  padding: '0 8px',
               },
               '& .MuiDataGrid-cell': {
                  padding: '0 8px',
               },
               '& .MuiDataGrid-toolbarContainer': {
                  padding: '8px',
                  flexWrap: 'wrap',
               }
            }}
          />
        )}
      </Box>

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

