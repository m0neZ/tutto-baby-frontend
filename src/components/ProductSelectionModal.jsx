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
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { authFetch } from '../api';

const ProductSelectionModal = ({ open, onClose, onProductsSelected }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/produtos/');
      if (response && Array.isArray(response.produtos)) {
        // Filter only products with quantity > 0
        const availableProducts = response.produtos.filter(p => p.quantidade_atual > 0);
        setProducts(availableProducts);
      } else {
        setProducts([]);
      }
      setError(null);
    } catch (err) {
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

  const handleRowSelectionChange = (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      setSelectedRows(updaterOrValue(selectedRows));
    } else {
      setSelectedRows(updaterOrValue);
    }
  };

  const handleConfirm = () => {
    // Ensure selectedRows is an object with keys for row IDs
    if (typeof selectedRows === 'object' && !Array.isArray(selectedRows)) {
      const selectedProducts = Object.keys(selectedRows)
        .filter(id => selectedRows[id])
        .map(id => products.find(product => product.id === parseInt(id, 10)))
        .filter(Boolean);
      
      onProductsSelected(selectedProducts);
    } else {
      // Fallback for when selectedRows is an array (shouldn't happen with MaterialReactTable)
      const selectedProducts = (Array.isArray(selectedRows) ? selectedRows : [])
        .map(rowId => products.find(product => product.id === rowId))
        .filter(Boolean);
      
      onProductsSelected(selectedProducts);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle>Selecionar Produtos</DialogTitle>
      
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box mb={2}>
          <TextField
            label="Buscar produtos"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, tamanho ou cor/estampa"
          />
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <Typography align="center" color="text.secondary" py={4}>
                Nenhum produto disponível em estoque
              </Typography>
            ) : (
              <MaterialReactTable
                columns={columns}
                data={filteredProducts}
                localization={MRT_Localization_PT_BR}
                enableRowSelection
                onRowSelectionChange={handleRowSelectionChange}
                state={{ rowSelection: selectedRows }}
                initialState={{
                  density: 'compact',
                  pagination: { pageSize: 10 },
                }}
                muiTableBodyRowProps={{ hover: true }}
                enableColumnFilters={false}
                enableGlobalFilter={false}
                enableTopToolbar={false}
              />
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Box display="flex" justifyContent="space-between" width="100%" px={2} alignItems="center">
          <Typography variant="body2">
            {selectedRows.length} produto(s) selecionado(s)
          </Typography>
          <Box>
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              color="primary" 
              variant="contained"
              disabled={selectedRows.length === 0 || loading}
            >
              Confirmar
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProductSelectionModal;
