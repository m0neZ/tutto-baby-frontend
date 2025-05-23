// src/components/SaleSelectionModal.jsx
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
import dayjs from 'dayjs';

const SaleSelectionModal = ({ open, onClose, onSaleSelected }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchSales();
    }
  }, [open]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/vendas/');
      if (response && Array.isArray(response.vendas)) {
        // Only show completed sales with status "Pago"
        const completedSales = response.vendas.filter(s => s.status === 'Pago');
        setSales(completedSales);
      } else {
        setSales([]);
      }
      setError(null);
    } catch (err) {
      setError('Erro ao carregar vendas: ' + (err.message || 'Erro desconhecido'));
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
      },
      {
        accessorKey: 'cliente_nome',
        header: 'Cliente',
        size: 200,
        Cell: ({ row }) => {
          return `${row.original.cliente_nome || ''} ${row.original.cliente_sobrenome || ''}`;
        },
      },
      {
        accessorKey: 'data_venda',
        header: 'Data',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? dayjs(value).format('DD/MM/YYYY') : '';
        },
      },
      {
        accessorKey: 'valor_total',
        header: 'Valor (R$)',
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

  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) return sales;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return sales.filter(sale => 
      (sale.cliente_nome?.toLowerCase().includes(lowerSearchTerm)) ||
      (sale.cliente_sobrenome?.toLowerCase().includes(lowerSearchTerm)) ||
      (sale.id?.toString().includes(lowerSearchTerm))
    );
  }, [sales, searchTerm]);

  const handleRowClick = (row) => {
    setSelectedRow(row.id);
  };

  const handleConfirm = () => {
    if (selectedRow === null) return;
    
    const selectedSale = sales.find(sale => sale.id === selectedRow);
    if (selectedSale) {
      onSaleSelected(selectedSale);
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
      <DialogTitle>Selecionar Venda</DialogTitle>
      
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box mb={2}>
          <TextField
            label="Buscar vendas"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome do cliente ou ID da venda"
          />
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredSales.length === 0 ? (
              <Typography align="center" color="text.secondary" py={4}>
                Nenhuma venda encontrada
              </Typography>
            ) : (
              <MaterialReactTable
                columns={columns}
                data={filteredSales}
                localization={MRT_Localization_PT_BR}
                enableRowSelection={false}
                muiTableBodyRowProps={({ row }) => ({
                  onClick: () => handleRowClick(row.original),
                  selected: selectedRow === row.original.id,
                  hover: true,
                  sx: {
                    cursor: 'pointer',
                    backgroundColor: selectedRow === row.original.id ? 'rgba(25, 118, 210, 0.08)' : undefined,
                  },
                })}
                initialState={{
                  density: 'compact',
                  pagination: { pageSize: 10 },
                  sorting: [{ id: 'data_venda', desc: true }],
                }}
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
            {selectedRow !== null ? '1 venda selecionada' : 'Nenhuma venda selecionada'}
          </Typography>
          <Box>
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              color="primary" 
              variant="contained"
              disabled={selectedRow === null || loading}
            >
              Confirmar
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SaleSelectionModal;
