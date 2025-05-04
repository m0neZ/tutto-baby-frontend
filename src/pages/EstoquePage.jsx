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
  // Ensure value is treated as a number before formatting
  const numValue = Number(value);
  if (isNaN(numValue)) return 'R$ -'; // Handle potential non-numeric values gracefully
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

// Helper function to format date
const formatDate = (value) => {
  if (!value) return '-';
  try {
    // Ensure the date is parsed correctly, handling potential timezone issues if necessary
    const date = new Date(value);
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) return '-'; 
    return date.toLocaleDateString("pt-BR", { timeZone: 'UTC' }); // Specify UTC to avoid timezone shifts if dates are stored as UTC
  } catch (e) {
    return '-';
  }
};

const EstoquePage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/produtos/`);
      if (!response.ok) {
        // Try to get error message from backend if available
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (jsonError) {
            // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      // Ensure each product has a unique 'id' field for DataGrid
      const fetchedProdutos = (data.produtos || (data.success && data.produtos) || []).map(p => ({ ...p, id: p.id_produto }));
      setProdutos(fetchedProdutos);
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Define columns for MUI X DataGrid
  // Adjusted widths/flex slightly to potentially avoid scroll
  const columns = [
    { field: 'nome', headerName: 'Nome', flex: 1.5, minWidth: 180 }, // Slightly reduced minWidth
    { field: 'sexo', headerName: 'Sexo', width: 90 }, // Slightly reduced width
    { field: 'cor_estampa', headerName: 'Cor/Estampa', flex: 1, minWidth: 130 }, // Slightly reduced minWidth
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
      width: 110, // Slightly reduced width
      valueFormatter: (value) => formatCurrency(value),
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'preco_venda',
      headerName: 'Preço Venda',
      type: 'number',
      width: 120, // Slightly reduced width
      valueFormatter: (value) => formatCurrency(value),
      align: 'right',
      headerAlign: 'right'
    },
    { field: 'nome_fornecedor', headerName: 'Fornecedor', flex: 1, minWidth: 140 }, // Slightly reduced minWidth
    {
      field: 'data_compra',
      headerName: 'Data Compra',
      type: 'date',
      width: 120, // Slightly reduced width
      valueGetter: (value) => value ? new Date(value) : null, // Ensure it's a Date object for filtering/sorting
      valueFormatter: (value) => formatDate(value)
    },
  ];

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleProductAdded = () => {
    handleCloseAddModal();
    fetchProdutos(); // Refresh data after adding
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}> {/* Use xl for wider tables */}
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      <Box sx={{ height: 650, width: '100%' }}> {/* Define height for DataGrid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={produtos}
            columns={columns}
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText} // Portuguese localization
            slots={{
              toolbar: GridToolbar, // Enable the toolbar for filtering, density, export, etc.
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true, // Enable global search
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            initialState={{
              sorting: {
                sortModel: [{ field: 'nome', sort: 'asc' }], // Default sort
              },
              pagination: {
                  paginationModel: { page: 0, pageSize: 100 },
              },
              // Ensure column filters are enabled by default
              filter: {
                filterModel: {
                  items: [],
                },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            density="compact"
            // The free version (DataGrid) does not support row grouping or aggregation.
            // These features require DataGridPro.
            // Filtering (global and column) and sorting are enabled via GridToolbar.
            // Date range filtering is supported via the column filter menu.
            sx={{
               boxShadow: 1,
               border: '1px solid',
               borderColor: 'divider',
               // Ensure table layout adjusts automatically
               // tableLayout: 'auto', // Let browser handle layout (default)
               '& .MuiDataGrid-columnHeader': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
               },
               '& .MuiDataGrid-columnHeaderTitleContainer': {
                  padding: '0 8px', // Adjust header padding
               },
               '& .MuiDataGrid-cell': {
                  padding: '0 8px', // Adjust cell padding
               },
               // Ensure toolbar doesn't cause overflow
               '& .MuiDataGrid-toolbarContainer': {
                  padding: '8px',
                  flexWrap: 'wrap', // Allow toolbar items to wrap if needed
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

export default EstoquePage;

