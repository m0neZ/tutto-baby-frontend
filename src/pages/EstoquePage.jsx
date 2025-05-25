// src/pages/EstoquePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_AggregationFns,
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddProductModal from '../components/AddProductModal';
import ImportInventoryModal from '../components/ImportInventoryModal';
import InventoryScorecard from '../components/InventoryScorecard';
import StockLevelIndicator from '../components/StockLevelIndicator';
import { authFetch } from '../api';

dayjs.extend(isBetween);

/* ---------------- helpers ---------------- */
const formatCurrency = v => {
  if (v == null || isNaN(+v)) return 'R$ -';
  
  // Format with thousands separator (dot) and decimal separator (comma)
  return `R$ ${Number(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = v =>
  v ? (dayjs(v).isValid() ? dayjs(v).format('DD/MM/YYYY') : '-') : '-';

// Completely rewritten with maximum safety
const onlyNums = arr => {
  // Ensure we have an array
  if (!arr) return [];
  if (!Array.isArray(arr)) return [];
  
  // Filter out non-numbers and NaN values
  return arr.filter(n => 
    n !== null && 
    n !== undefined && 
    typeof n === 'number' && 
    !Number.isNaN(n)
  );
};

// Custom safe aggregation functions that never pass undefined to MRT functions
const safeSum = vals => {
  try {
    // Ensure we have an array of numbers
    const safeVals = onlyNums(vals);
    
    // If empty, return 0 instead of calling MRT_AggregationFns
    if (safeVals.length === 0) return 0;
    
    // Calculate sum manually to avoid MRT_AggregationFns issues
    return safeVals.reduce((sum, val) => sum + val, 0);
  } catch (e) {
    console.error('Error in safeSum:', e);
    return 0;
  }
};

const safeMean = vals => {
  try {
    // Ensure we have an array of numbers
    const safeVals = onlyNums(vals);
    
    // If empty, return 0 instead of calling MRT_AggregationFns
    if (safeVals.length === 0) return 0;
    
    // Calculate mean manually to avoid MRT_AggregationFns issues
    const sum = safeVals.reduce((sum, val) => sum + val, 0);
    return safeVals.length > 0 ? sum / safeVals.length : 0;
  } catch (e) {
    console.error('Error in safeMean:', e);
    return 0;
  }
};

/* -------------- error boundary ----------- */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(e, info) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error in EstoquePage:', e, info);
  }
  render() {
    return this.state.hasError ? (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">
          Ocorreu um erro ao renderizar a tabela de estoque.
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
        </Alert>
      </Container>
    ) : (
      this.props.children
    );
  }
}

/* -------------- main content ------------- */
function EstoquePageContent() {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [openDel, setOpenDel] = useState(false);
  const [delRow, setDelRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Stock quantities by unique item
  const [stockQuantities, setStockQuantities] = useState({});
  const [isLoadingStock, setIsLoadingStock] = useState(true);

  // Toggle for showing/hiding sold items (quantity = 0)
  const [showSoldItems, setShowSoldItems] = useState(false);

  const [grouping, setGrouping] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [columnFilters, setColumnFilters] = useState([]);

  /* ---------- fetch products (auth) ---------- */
  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authFetch('/produtos/');
      // Ensure we always have an array, even if API returns null/undefined
      const list = Array.isArray(data?.produtos) ? data.produtos : [];
      // Ensure each item has an id
      setRows(list.map(p => ({ ...p, id: p.id ?? p.id_produto ?? Math.random().toString(36) })));
      setError(null);
      
      // Calculate stock quantities by unique item (nome, tamanho, sexo, cor_estampa)
      calculateStockQuantities(list);
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate stock quantities for each unique item
  const calculateStockQuantities = useCallback((products) => {
    setIsLoadingStock(true);
    try {
      const quantities = {};
      
      // Group products by unique combination (nome, tamanho, sexo, cor_estampa)
      products.forEach(product => {
        const key = `${product.nome}|${product.tamanho}|${product.sexo}|${product.cor_estampa}`;
        if (!quantities[key]) {
          quantities[key] = 0;
        }
        quantities[key] += product.quantidade_atual || 0;
      });
      
      // Assign quantities to each product
      const productQuantities = {};
      products.forEach(product => {
        const key = `${product.nome}|${product.tamanho}|${product.sexo}|${product.cor_estampa}`;
        productQuantities[product.id] = quantities[key];
      });
      
      setStockQuantities(productQuantities);
    } catch (e) {
      console.error('Error calculating stock quantities:', e);
    } finally {
      setIsLoadingStock(false);
    }
  }, []);

  useEffect(() => { 
    fetchProdutos();
  }, [fetchProdutos]);

  // Filter rows based on column filters for scorecards
  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return rows;
    }

    // First filter by quantity if showSoldItems is false
    let filtered = rows;
    if (!showSoldItems) {
      filtered = filtered.filter(row => (row.quantidade_atual || 0) > 0);
    }

    // Then apply column filters if any
    if (columnFilters.length === 0) {
      return filtered;
    }

    return filtered.filter(row => {
      return columnFilters.every(filter => {
        const { id, value } = filter;
        
        // Handle date range filters
        if (id === 'data_compra' && Array.isArray(value)) {
          const [start, end] = value;
          const rowDate = dayjs(row[id]);
          
          if (!rowDate.isValid()) return false;
          
          if (start && end) {
            return rowDate.isBetween(
              dayjs(start).startOf('day'), 
              dayjs(end).endOf('day'), 
              'day', 
              '[]'
            );
          }
          if (start) return rowDate.isSameOrAfter(dayjs(start).startOf('day'));
          if (end) return rowDate.isSameOrBefore(dayjs(end).endOf('day'));
          return true;
        }
        
        // Handle text filters
        if (typeof value === 'string') {
          const rowValue = String(row[id] || '').toLowerCase();
          return rowValue.includes(value.toLowerCase());
        }
        
        return true;
      });
    });
  }, [rows, columnFilters, showSoldItems]);

  /* --------------- columns ------------------- */
  const columns = useMemo(() => {
    // Completely rewritten footer function with maximum safety
    const footer = accessor => ({ table }) => {
      try {
        // Ensure table exists
        if (!table) {
          return <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>-</Box>;
        }
        
        // Ensure getFilteredRowModel exists and is a function
        if (!table.getFilteredRowModel || typeof table.getFilteredRowModel !== 'function') {
          return <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>-</Box>;
        }
        
        // Get rows safely
        const rowModel = table.getFilteredRowModel();
        if (!rowModel) {
          return <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>-</Box>;
        }
        
        // Ensure rows is an array
        const rows = Array.isArray(rowModel.rows) ? rowModel.rows : [];
        
        // Create a safe array of values
        const vals = [];
        
        // Safely extract values
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row && typeof row.getValue === 'function') {
            try {
              const value = row.getValue(accessor);
              // Only include numeric values
              if (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value)) {
                vals.push(value);
              }
            } catch (e) {
              console.error(`Error getting value for accessor ${accessor}:`, e);
              // Continue to next row on error
            }
          }
        }
        
        // Choose aggregation function based on accessor
        if (accessor === 'quantidade_atual') {
          const sum = safeSum(vals);
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              Total: {sum}
            </Box>
          );
        } else if (accessor === 'custo' || accessor === 'preco_venda') {
          // Always show both mean and sum for cost and price
          const mean = safeMean(vals);
          const sum = safeSum(vals);
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              <div>Média: {formatCurrency(mean)}</div>
              <div>Soma: {formatCurrency(sum)}</div>
            </Box>
          );
        } else {
          const sum = safeSum(vals);
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              Total: {formatCurrency(sum)}
            </Box>
          );
        }
      } catch (e) {
        console.error('Error in footer function:', e);
        return <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>-</Box>;
      }
    };

    const baseColumns = [
      { 
        accessorKey: 'nome', 
        header: 'Nome', 
        size: 180, 
        enableGrouping: true,
        muiTableHeadCellProps: {
          align: 'left',
        },
      },
      { 
        accessorKey: 'sexo', 
        header: 'Sexo', 
        size: 90, 
        enableGrouping: true,
        muiTableHeadCellProps: {
          align: 'left',
        },
      },
      { 
        accessorKey: 'cor_estampa', 
        header: 'Cor/Estampa', 
        size: 130, 
        enableGrouping: true,
        muiTableHeadCellProps: {
          align: 'left',
        },
      },
      { 
        accessorKey: 'tamanho', 
        header: 'Tamanho', 
        size: 100, 
        enableGrouping: true,
        muiTableHeadCellProps: {
          align: 'left',
        },
        Cell: ({ cell, row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{cell.getValue()}</span>
            {!isLoadingStock && stockQuantities[row.original.id] !== undefined && (
              <StockLevelIndicator quantidade={stockQuantities[row.original.id]} />
            )}
          </Box>
        ),
      },
      {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        size: 80,
        aggregationFn: 'sum',
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
        AggregatedCell: ({ cell, table }) => {
          // Safely get aggregated value
          let value = 0;
          try {
            if (cell && typeof cell.getValue === 'function') {
              const rawValue = cell.getValue();
              if (rawValue !== null && rawValue !== undefined && !isNaN(rawValue)) {
                value = rawValue;
              }
            }
          } catch (e) {
            console.error('Error in quantity AggregatedCell formatter:', e);
          }
          
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              Total: {value}
            </Box>
          );
        },
        Footer: footer('quantidade_atual'),
      },
      {
        accessorKey: 'custo',
        header: 'Custo',
        size: 110,
        aggregationFn: 'mean', // Default to mean for grouped cells
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
        Cell: ({ cell }) => {
          // Safely get value
          let value = 0;
          try {
            if (cell && typeof cell.getValue === 'function') {
              const rawValue = cell.getValue();
              if (rawValue !== null && rawValue !== undefined && !isNaN(rawValue)) {
                value = rawValue;
              }
            }
          } catch (e) {
            console.error('Error in Cell formatter:', e);
          }
          return formatCurrency(value);
        },
        AggregatedCell: ({ cell, table, row }) => {
          // Get the grouped rows for this cell
          const groupedRows = row?.subRows || [];
          
          // Extract values from grouped rows
          const values = [];
          for (const row of groupedRows) {
            try {
              const value = row.getValue('custo');
              if (value !== null && value !== undefined && !isNaN(value)) {
                values.push(value);
              }
            } catch (e) {
              console.error('Error extracting value in AggregatedCell:', e);
            }
          }
          
          // Calculate mean and sum
          const mean = safeMean(values);
          const sum = safeSum(values);
          
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              <div>Média: {formatCurrency(mean)}</div>
              <div>Soma: {formatCurrency(sum)}</div>
            </Box>
          );
        },
        Footer: footer('custo'),
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda',
        size: 120,
        aggregationFn: 'mean', // Default to mean for grouped cells
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
        Cell: ({ cell }) => {
          // Safely get value
          let value = 0;
          try {
            if (cell && typeof cell.getValue === 'function') {
              const rawValue = cell.getValue();
              if (rawValue !== null && rawValue !== undefined && !isNaN(rawValue)) {
                value = rawValue;
              }
            }
          } catch (e) {
            console.error('Error in Cell formatter:', e);
          }
          return formatCurrency(value);
        },
        AggregatedCell: ({ cell, table, row }) => {
          // Get the grouped rows for this cell
          const groupedRows = row?.subRows || [];
          
          // Extract values from grouped rows
          const values = [];
          for (const row of groupedRows) {
            try {
              const value = row.getValue('preco_venda');
              if (value !== null && value !== undefined && !isNaN(value)) {
                values.push(value);
              }
            } catch (e) {
              console.error('Error extracting value in AggregatedCell:', e);
            }
          }
          
          // Calculate mean and sum
          const mean = safeMean(values);
          const sum = safeSum(values);
          
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              <div>Média: {formatCurrency(mean)}</div>
              <div>Soma: {formatCurrency(sum)}</div>
            </Box>
          );
        },
        Footer: footer('preco_venda'),
      },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        size: 120,
        Cell: ({ cell }) => formatDate(cell.getValue()),
        enableGrouping: true,
        muiTableHeadCellProps: {
          align: 'left',
        },
      },
      {
        accessorKey: 'data_entrada',
        header: 'Data Entrada',
        size: 120,
        Cell: ({ cell }) => formatDate(cell.getValue()),
        enableGrouping: true,
        muiTableHeadCellProps: {
          align: 'left',
        },
      },
      {
        accessorKey: 'valor_total',
        header: 'Valor Total',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const custo = row.original.custo || 0;
          const quantidade = row.original.quantidade_atual || 0;
          const total = custo * quantidade;
          return formatCurrency(total);
        },
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
        Footer: footer('valor_total'),
      },
      {
        id: 'actions',
        header: 'Ações',
        size: 120,
        enableColumnFilter: false,
        enableGrouping: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="Editar">
              <IconButton
                color="primary"
                onClick={() => {
                  setEditRow(row.original);
                  setOpenEdit(true);
                }}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton
                color="error"
                onClick={() => {
                  setDelRow(row.original);
                  setOpenDel(true);
                }}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ];

    return baseColumns;
  }, [stockQuantities, isLoadingStock]);

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!delRow) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await authFetch(`/produtos/${delRow.id}`, {
        method: 'DELETE',
      });
      
      // Refresh product list
      fetchProdutos();
      setOpenDel(false);
    } catch (error) {
      setDeleteError(`Erro ao excluir produto: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle product save (create/update)
  const handleSaveProduct = async (productData) => {
    try {
      if (editRow) {
        // Update existing product
        await authFetch(`/produtos/${editRow.id}`, {
          method: 'PATCH',
          body: JSON.stringify(productData),
        });
      } else {
        // Create new product
        await authFetch('/produtos/', {
          method: 'POST',
          body: JSON.stringify(productData),
        });
      }
      
      // Refresh product list
      fetchProdutos();
      
      // Close modal
      setOpenAdd(false);
      setOpenEdit(false);
      setEditRow(null);
      
      return true;
    } catch (error) {
      console.error('Error saving product:', error);
      return false;
    }
  };

  // Handle import completion
  const handleImportComplete = () => {
    fetchProdutos();
    setIsImportModalOpen(false);
  };

  // Create table instance
  const table = useMaterialReactTable({
    columns,
    data: filteredRows,
    enableRowSelection: false,
    enableColumnResizing: true,
    enablePinning: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableColumnActions: true,
    enableGrouping: true,
    enableColumnDragging: false,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enablePagination: true,
    manualPagination: false,
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    muiToolbarAlertBannerProps: {
      color: 'info',
      children: 'Selecione uma coluna para agrupar',
    },
    onGroupingChange: setGrouping,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    state: {
      grouping,
      pagination,
      columnFilters,
      showSkeletons: loading,
    },
    localization: MRT_Localization_PT_BR,
    initialState: {
      density: 'compact',
      pagination: { pageIndex: 0, pageSize: 50 },
      columnVisibility: {
        data_compra: false,
        data_entrada: false,
      },
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '600px',
      },
    },
    muiTableHeadProps: {
      sx: {
        '& tr th': {
          backgroundColor: '#f5f5f5',
        },
      },
    },
    muiTableBodyProps: {
      sx: {
        '& tr:nth-of-type(odd)': {
          backgroundColor: '#fafafa',
        },
      },
    },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditRow(null);
            setOpenAdd(true);
          }}
          sx={{ textTransform: 'none' }}
        >
          Adicionar Produto
        </Button>
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={() => setIsImportModalOpen(true)}
        >
          Importar
        </Button>
        <FormControlLabel
          control={
            <Switch
              checked={showSoldItems}
              onChange={(e) => setShowSoldItems(e.target.checked)}
              color="primary"
            />
          }
          label="Mostrar itens vendidos"
        />
      </Box>
    ),
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
      
      <Box mb={4}>
        <Typography variant="h5" component="h1" gutterBottom>
          Estoque
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <InventoryScorecard
            title="Total de Produtos"
            value={filteredRows.length}
            loading={loading}
          />
          <InventoryScorecard
            title="Valor Total em Estoque"
            value={formatCurrency(
              filteredRows.reduce(
                (sum, row) => sum + (row.custo || 0) * (row.quantidade_atual || 0),
                0
              )
            )}
            loading={loading}
          />
          <InventoryScorecard
            title="Valor de Venda Potencial"
            value={formatCurrency(
              filteredRows.reduce(
                (sum, row) => sum + (row.preco_venda || 0) * (row.quantidade_atual || 0),
                0
              )
            )}
            loading={loading}
          />
          <InventoryScorecard
            title="Lucro Potencial"
            value={formatCurrency(
              filteredRows.reduce(
                (sum, row) =>
                  sum +
                  ((row.preco_venda || 0) - (row.custo || 0)) * (row.quantidade_atual || 0),
                0
              )
            )}
            loading={loading}
          />
        </Box>
      </Box>
      
      <Paper elevation={2}>
        <MaterialReactTable table={table} />
      </Paper>
      
      {/* Add/Edit Product Modal */}
      <AddProductModal
        open={openAdd || openEdit}
        onClose={() => {
          setOpenAdd(false);
          setOpenEdit(false);
          setEditRow(null);
        }}
        onSave={handleSaveProduct}
        editData={editRow}
        isEdit={!!editRow}
      />
      
      {/* Import Modal */}
      <ImportInventoryModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDel}
        onClose={() => !isDeleting && setOpenDel(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja excluir o produto "{delRow?.nome}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDel(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteProduct}
            color="error"
            autoFocus
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function EstoquePage() {
  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <EstoquePageContent />
      </LocalizationProvider>
    </ErrorBoundary>
  );
}
