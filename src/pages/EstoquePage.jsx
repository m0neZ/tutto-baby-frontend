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
import AddCircleOutlineIcon from '@mui/icons-material/Add';
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
        accessorKey: 'nome_fornecedor', 
        header: 'Fornecedor', 
        size: 140, 
        enableGrouping: true,
        muiTableHeadCellProps: {
          align: 'left',
        },
      },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        size: 120,
        muiTableHeadCellProps: {
          align: 'left',
        },
        Cell: ({ cell }) => {
          // Safely get value
          let value = null;
          try {
            if (cell && typeof cell.getValue === 'function') {
              value = cell.getValue();
            }
          } catch (e) {
            console.error('Error in date Cell formatter:', e);
          }
          return formatDate(value);
        },
        filterVariant: 'date-range',
        filterFn: (row, id, [start, end]) => {
          try {
            if (!row || typeof row.getValue !== 'function') return false;
            const value = row.getValue(id);
            if (!value) return false;
            
            const d = dayjs(value);
            if (!d.isValid()) return false;
            
            if (start && end) return d.isBetween(dayjs(start).startOf('day'), dayjs(end).endOf('day'), 'day', '[]');
            if (start) return d.isSameOrAfter(dayjs(start).startOf('day'));
            if (end)   return d.isSameOrBefore(dayjs(end).endOf('day'));
            return true;
          } catch (e) {
            console.error('Error in date filter function:', e);
            return false;
          }
        },
      },
    ];
    
    return baseColumns;
  }, [stockQuantities, isLoadingStock]);

  // Apply the showSoldItems filter to the data
  const displayData = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    
    if (!showSoldItems) {
      return rows.filter(row => (row.quantidade_atual || 0) > 0);
    }
    
    return rows;
  }, [rows, showSoldItems]);

  /* --------------- table instance ------------ */
  const table = useMaterialReactTable({
    columns,
    // Ensure data is always an array and filtered by showSoldItems
    data: Array.isArray(displayData) ? displayData : [],
    localization: MRT_Localization_PT_BR,
    enableGrouping: true,
    enableStickyHeader: true,
    enableDensityToggle: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    enableTableFooter: true,
    enableColumnFilters: true,
    enableColumnVisibility: true, // Enable native column visibility toggle
    initialState: {
      density: 'compact',
      sorting: [{ id: 'nome', desc: false }],
      pagination,
      columnVisibility: {
        quantidade_atual: false, // Hide quantity column by default
      },
    },
    state: {
      isLoading: loading,
      showAlertBanner: !!error,
      grouping,
      pagination,
      columnFilters,
    },
    muiToolbarAlertBannerProps: error ? { color: 'error', children: error } : undefined,
    onGroupingChange: setGrouping,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    muiTableContainerProps: { sx: { maxHeight: 650 } },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => { setEditRow(null); setOpenAdd(true); }}
        >
          Adicionar Produto
        </Button>
        {/* Changed to IconButton with Tooltip */}
        <Tooltip title="Importar Produtos">
          <IconButton
            color="secondary" // Use theme's secondary color (pink)
            onClick={() => setIsImportModalOpen(true)}
            sx={{ 
              backgroundColor: theme.palette.secondary.main, // Ensure background is filled
              color: theme.palette.secondary.contrastText, // Ensure icon contrast
              '&:hover': {
                backgroundColor: theme.palette.secondary.dark, // Darken on hover
              }
            }}
          >
            <CloudUploadIcon />
          </IconButton>
        </Tooltip>
        
        {/* Toggle for showing/hiding sold items */}
        <FormControlLabel
          control={
            <Switch
              checked={showSoldItems}
              onChange={(e) => setShowSoldItems(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {showSoldItems ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
              <Typography variant="body2">
                {showSoldItems ? "Mostrar Itens Vendidos" : "Apenas Estoque Disponível"}
              </Typography>
            </Box>
          }
          sx={{ ml: 2 }}
        />
      </Box>
    ),
    renderToolbarInternalActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <MRT_ToggleFiltersButton table={table} />
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
      </Box>
    ),
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Editar">
          <IconButton
            size="small"
            onClick={() => { setEditRow(row.original); setOpenEdit(true); }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            size="small"
            color="error"
            onClick={() => { setDelRow(row.original); setOpenDel(true); setDeleteError(null); }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    muiTableHeadCellProps: {
      align: 'left', // Consistent alignment for all headers
      sx: theme => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontWeight: 'bold',
        '& .MuiBox-root': {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        },
        '& .MuiTableSortLabel-root': {
          flexDirection: 'row',
        },
      }),
    },
    muiTableBodyProps: {
      sx: theme => ({
        '& tr:nth-of-type(odd)  > td': { backgroundColor: theme.palette.background.paper },
        '& tr:nth-of-type(even) > td': { backgroundColor: theme.palette.action.hover },
      }),
    },
    muiTableFooterProps: {
      sx: theme => ({
        backgroundColor: theme.palette.grey[200],
        '& td': { fontWeight: 'bold' },
      }),
    },
  });

  /* ---------- modal helpers ---------- */
  const refreshThenClose = () => {
    fetchProdutos();
    setOpenAdd(false);
    setOpenEdit(false);
  };

  const handleCloseImportModal = (shouldRefresh) => {
    setIsImportModalOpen(false);
    if (shouldRefresh) {
      fetchProdutos();
    }
  };

  /* ---------- delete product ---------- */
  const handleDeleteProduct = async () => {
    if (!delRow?.id) {
      setDeleteError('ID do produto não encontrado');
      return;
    }
    
    // Check if product quantity is 1 (can only delete products with quantity = 1)
    if (delRow.quantidade_atual !== 1) {
      setDeleteError('Só é possível excluir produtos com quantidade = 1.');
      return;
    }
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await authFetch(`/produtos/${delRow.id}`, { method: 'DELETE' });
      
      if (!response || !response.success) {
        // Handle specific error for products with transaction history
        if (response?.error && response.error.includes('histórico de transações')) {
          setDeleteError(
            'Não é possível excluir este produto pois ele possui histórico de transações. ' +
            'Considere zerar a quantidade em vez de excluir.'
          );
        } else {
          setDeleteError(response?.error || 'Erro ao excluir produto');
        }
        return;
      }
      
      fetchProdutos();
      setOpenDel(false);
    } catch (e) {
      console.error('Delete error:', e);
      setDeleteError(e?.message || 'Falha ao excluir produto');
    } finally {
      setIsDeleting(false);
    }
  };

  /* --------------- render ---------------- */
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 'bold'
          }}
        >
          Estoque de produtos
        </Typography>

        {/* Scorecards */}
        <InventoryScorecard products={filteredRows} loading={loading} />

        {loading && <CircularProgress />}
        {error && !loading && <Alert severity="error">{error}</Alert>}

        {!loading && (
          <Box sx={{ width: '100%' }}>
            <MaterialReactTable table={table} />
          </Box>
        )}

        <AddProductModal
          open={openAdd || openEdit}
          onClose={() => { setOpenAdd(false); setOpenEdit(false); }}
          onSuccess={refreshThenClose}
          productData={editRow}
          isEditMode={!!editRow}
        />

        {/* Import Products Modal */}
        <ImportInventoryModal
          open={isImportModalOpen}
          onClose={handleCloseImportModal}
        />

        {/* confirm delete */}
        <Dialog 
          open={openDel} 
          onClose={() => !isDeleting && setOpenDel(false)}
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: '500px'
            }
          }}
        >
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja excluir "{delRow?.nome}"?
            </DialogContentText>
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDel(false)} 
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              color="error"
              onClick={handleDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? <CircularProgress size={24} /> : 'Excluir'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
}

/* ----------- wrapped in boundary ---------- */
export default function EstoquePage() {
  return (
    <ErrorBoundary>
      <EstoquePageContent />
    </ErrorBoundary>
  );
}
