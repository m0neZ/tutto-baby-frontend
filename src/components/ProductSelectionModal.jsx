// src/components/ProductSelectionModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { authFetch } from '../api';
import { useTheme } from '@mui/material/styles';

const ProductSelectionModal = ({ open, onClose, onProductsSelected }) => {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  // Add state for pagination
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
      // Reset selection when modal opens
      setRowSelection({});
      // Reset pagination to first page
      setPagination({
        pageIndex: 0,
        pageSize: 10,
      });
    }
  }, [open]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/produtos/');
      if (response && Array.isArray(response.produtos)) {
        // Filter only products with quantity > 0
        const availableProducts = response.produtos.filter(p => p.quantidade_atual > 0);
        // Add unique keys to ensure proper selection tracking
        const productsWithKeys = availableProducts.map(p => ({
          ...p,
          id: p.id || Math.random().toString(36).substr(2, 9)
        }));
        setProducts(productsWithKeys);
        console.log('Loaded products:', productsWithKeys.length);
      } else {
        setProducts([]);
        console.log('No products returned from API');
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Erro ao carregar produtos: ' + (err.message || 'Erro desconhecido'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'nome',
        header: 'Nome',
        size: 200,
      },
      {
        accessorKey: 'tamanho',
        header: 'Tamanho',
        size: 100,
      },
      {
        accessorKey: 'cor_estampa',
        header: 'Cor/Estampa',
        size: 150,
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço (R$)',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value !== null && value !== undefined
            ? `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`
            : '';
        },
      },
    ],
    []
  );

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return products.filter(product => 
      product.nome?.toLowerCase().includes(lowerSearchTerm) ||
      product.tamanho?.toLowerCase().includes(lowerSearchTerm) ||
      product.cor_estampa?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [products, searchTerm]);

  const handleConfirm = () => {
    try {
      // Get selected product IDs from rowSelection object
      const selectedProductIds = Object.entries(rowSelection)
        .filter(([_, selected]) => selected)
        .map(([id, _]) => {
          // Handle both string and numeric IDs
          return isNaN(id) ? id : parseInt(id, 10);
        });
      
      console.log('Selected product IDs:', selectedProductIds);
      
      // Find the corresponding product objects
      const selectedProducts = selectedProductIds
        .map(id => {
          const product = products.find(p => 
            // Match either string or number ID
            String(p.id) === String(id)
          );
          if (!product) {
            console.warn(`Product with ID ${id} not found`);
          }
          return product;
        })
        .filter(Boolean); // Remove any undefined values
      
      console.log('Selected products:', selectedProducts);
      
      if (selectedProducts.length > 0) {
        onProductsSelected(selectedProducts);
      } else {
        console.warn('No products selected or found');
        // If no products selected, just close without action
        onClose();
      }
    } catch (error) {
      console.error('Error in product selection:', error);
      // Fallback: close the modal
      onClose();
    }
  };

  // Count selected products
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh', borderRadius: '12px' } }}
    >
      <DialogTitle sx={{ 
        fontSize: '1.5rem', 
        fontWeight: 600, 
        pb: 2, 
        borderBottom: '1px solid #eee'
      }}>
        Selecionar Produtos
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
        
        <Box mb={3}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '0.25rem'
          }}>
            Buscar produtos
          </label>
          <TextField
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, tamanho ou cor/estampa"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '&:hover fieldset': { borderColor: theme.palette.accent.main },
                '&.Mui-focused fieldset': { borderColor: theme.palette.accent.main },
              }
            }}
          />
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <Box 
                sx={{ 
                  p: 4, 
                  border: '1px dashed #e0e0e0', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fafafa'
                }}
              >
                <Typography variant="body1" color="text.secondary" align="center">
                  Nenhum produto disponível em estoque
                </Typography>
              </Box>
            ) : (
              <MaterialReactTable
                columns={columns}
                data={filteredProducts}
                localization={MRT_Localization_PT_BR}
                enableRowSelection
                positionToolbarAlertBanner="bottom"
                enablePagination={true}
                enableBottomToolbar={true}
                state={{ 
                  rowSelection,
                  pagination,
                  density: 'compact',
                }}
                onRowSelectionChange={setRowSelection}
                onPaginationChange={setPagination}
                muiTableBodyRowProps={{ hover: true }}
                enableColumnFilters={false}
                enableGlobalFilter={false}
                enableTopToolbar={true}
                initialState={{
                  density: 'compact',
                  pagination: { pageIndex: 0, pageSize: 10 },
                }}
                muiTablePaperProps={{
                  sx: {
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                  },
                }}
                muiTableHeadProps={{
                  sx: {
                    '& .MuiTableCell-root': {
                      backgroundColor: '#f5f5f5',
                    },
                  },
                }}
                muiBottomToolbarProps={{
                  sx: {
                    backgroundColor: '#f5f5f5',
                  },
                }}
                paginationDisplayMode="pages"
                rowCount={filteredProducts.length}
                manualPagination={false}
              />
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {selectedCount} produto(s) selecionado(s)
        </Typography>
        <Box>
          <Button 
            onClick={onClose} 
            sx={{ 
              px: 3, 
              py: 1, 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              mr: 1
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained"
            disabled={selectedCount === 0 || loading}
            sx={{ 
              px: 3, 
              py: 1, 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: theme.palette.accent.main,
              color: theme.palette.accent.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.accent.dark,
              }
            }}
          >
            Confirmar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProductSelectionModal;
