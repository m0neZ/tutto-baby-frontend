// src/pages/VendasPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { authFetch } from '../api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import SaleForm from '../components/SaleForm';
import PaymentConfirmationModal from '../components/PaymentConfirmationModal';
import ExchangeForm from '../components/ExchangeForm';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

// Set locale for dayjs
dayjs.locale('pt-br');

export default function VendasPage() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [isExchangeFormOpen, setIsExchangeFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showAllSales, setShowAllSales] = useState(false);

  const fetchVendas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/vendas/', { method: 'GET' });
      const list = Array.isArray(res.vendas) ? res.vendas : [];
      setVendas(list);
      setError(null);
    } catch (e) {
      setError('Erro ao carregar vendas: ' + (e.message || 'Erro desconhecido'));
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  const handleCreateSale = async (saleData) => {
    try {
      await authFetch('/vendas/', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });
      fetchVendas();
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  };

  const handleUpdateSale = async (saleData, saleId) => {
    try {
      await authFetch(`/vendas/${saleId}`, {
        method: 'PATCH',
        body: JSON.stringify(saleData),
      });
      fetchVendas();
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      throw error;
    }
  };

  const handleDeleteSale = async (saleId) => {
    try {
      await authFetch(`/vendas/${saleId}`, {
        method: 'DELETE',
      });
      fetchVendas();
      setDeleteConfirmOpen(false);
      setDeleteError(null);
    } catch (error) {
      setDeleteError('Erro ao excluir venda: ' + (error.message || 'Erro desconhecido'));
      console.error('Erro ao excluir venda:', error);
    }
  };

  const handleConfirmPayment = async (saleId, paymentData) => {
    try {
      await authFetch(`/vendas/${saleId}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      fetchVendas();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  };

  const handleCreateExchange = async (exchangeData) => {
    try {
      await authFetch('/vendas/exchange', {
        method: 'POST',
        body: JSON.stringify(exchangeData),
      });
      fetchVendas();
    } catch (error) {
      console.error('Erro ao registrar troca:', error);
      throw error;
    }
  };

  const handleSaveSale = async (saleData, saleId = null) => {
    if (saleId) {
      await handleUpdateSale(saleData, saleId);
    } else {
      await handleCreateSale(saleData);
    }
  };

  const handleEditClick = (sale) => {
    setEditData(sale);
    setIsSaleFormOpen(true);
  };

  const handleDeleteClick = (sale) => {
    setSelectedSale(sale);
    setDeleteConfirmOpen(true);
  };

  const handlePaymentClick = (sale) => {
    setSelectedSale(sale);
    setIsPaymentModalOpen(true);
  };

  const filteredVendas = useMemo(() => {
    if (showAllSales) return vendas;
    return vendas.filter(venda => venda.status !== 'Cancelado');
  }, [vendas, showAllSales]);

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
        accessorKey: 'produto_nome',
        header: 'Produto',
        size: 200,
        Cell: ({ row }) => {
          const produto = row.original.produto || {};
          return (
            <Box>
              <Typography variant="body2">{produto.nome || 'N/A'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {produto.tamanho ? `${produto.tamanho} | ${produto.cor_estampa || ''}` : ''}
              </Typography>
            </Box>
          );
        },
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
        aggregationFn: 'sum',
        AggregatedCell: ({ cell }) => (
          <Box fontWeight="bold">
            {`R$ ${parseFloat(cell.getValue() || 0).toFixed(2).replace('.', ',')}`}
          </Box>
        ),
      },
      {
        accessorKey: 'desconto_percentual',
        header: 'Desconto (%)',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value !== null && value !== undefined
            ? `${parseFloat(value).toFixed(2).replace('.', ',')}%`
            : '0,00%';
        },
        aggregationFn: 'mean',
        AggregatedCell: ({ cell }) => (
          <Box fontWeight="bold">
            {`${parseFloat(cell.getValue() || 0).toFixed(2).replace('.', ',')}%`}
          </Box>
        ),
      },
      {
        accessorKey: 'desconto_valor',
        header: 'Desconto (R$)',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value !== null && value !== undefined
            ? `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`
            : 'R$ 0,00';
        },
        aggregationFn: 'sum',
        AggregatedCell: ({ cell }) => (
          <Box fontWeight="bold">
            {`R$ ${parseFloat(cell.getValue() || 0).toFixed(2).replace('.', ',')}`}
          </Box>
        ),
        enableHiding: true,
        hidden: true,
      },
      {
        accessorKey: 'forma_pagamento',
        header: 'Forma de Pagamento',
        size: 180,
      },
      {
        accessorKey: 'data_venda',
        header: 'Data Venda',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? dayjs(value).format('DD/MM/YYYY') : '';
        },
        enableHiding: true,
        hidden: true,
      },
      {
        accessorKey: 'data_pagamento',
        header: 'Data Pgto',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? dayjs(value).format('DD/MM/YYYY') : '';
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          let color = 'default';
          
          if (value === 'Pago') {
            color = 'success';
          } else if (value === 'Pagamento Pendente') {
            color = 'warning';
          } else if (value === 'Cancelado') {
            color = 'error';
          }
          
          return <Chip label={value} color={color} size="small" />;
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        size: 180,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="Editar">
              <IconButton
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(row.original);
                }}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Excluir">
              <IconButton
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(row.original);
                }}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {row.original.status === 'Pagamento Pendente' && (
              <Tooltip title="Confirmar Pagamento">
                <IconButton
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentClick(row.original);
                  }}
                  size="small"
                >
                  <PaymentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    []
  );

  if (loading && vendas.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h5" component="h1" gutterBottom>
          Vendas
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditData(null);
                setIsSaleFormOpen(true);
              }}
              sx={{ mr: 2 }}
            >
              Nova Venda
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SwapHorizIcon />}
              onClick={() => setIsExchangeFormOpen(true)}
            >
              Troca
            </Button>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={showAllSales}
                onChange={(e) => setShowAllSales(e.target.checked)}
                color="primary"
              />
            }
            label="Mostrar vendas canceladas"
          />
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
        
        <Paper elevation={2}>
          <MaterialReactTable
            columns={columns}
            data={filteredVendas}
            localization={MRT_Localization_PT_BR}
            enableGrouping
            enableColumnDragging={false}
            enableRowVirtualization
            muiTableContainerProps={{ sx: { maxHeight: '600px' } }}
            initialState={{
              density: 'compact',
              pagination: { pageSize: 50 },
              sorting: [{ id: 'data_venda', desc: true }],
              columnVisibility: {
                desconto_valor: false,
                data_venda: false,
              },
            }}
            enableRowSelection={false}
            enableColumnResizing
            enablePinning
            enableColumnFilters
            enableGlobalFilter
            enableColumnActions
            enableRowActions={false}
          />
        </Paper>
      </Box>
      
      {/* Sale Form Modal */}
      <SaleForm
        open={isSaleFormOpen}
        onClose={() => {
          setIsSaleFormOpen(false);
          setEditData(null);
        }}
        onSave={handleSaveSale}
        editData={editData}
      />
      
      {/* Exchange Form Modal */}
      <ExchangeForm
        open={isExchangeFormOpen}
        onClose={() => setIsExchangeFormOpen(false)}
        onSave={handleCreateExchange}
      />
      
      {/* Payment Confirmation Modal */}
      {selectedSale && (
        <PaymentConfirmationModal
          open={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedSale(null);
          }}
          onConfirm={handleConfirmPayment}
          sale={selectedSale}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={() => handleDeleteSale(selectedSale?.id)} 
            color="error" 
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Import Dialog components at the top
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
