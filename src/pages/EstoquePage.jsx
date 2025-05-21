// src/pages/EstoquePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_AggregationFns,
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
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FunctionsIcon from '@mui/icons-material/Functions';
import MovingIcon from '@mui/icons-material/Moving';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddProductModal from '../components/AddProductModal';
import InventoryScorecard from '../components/InventoryScorecard';
import { authFetch } from '../api';

dayjs.extend(isBetween);

/* ---------------- helpers ---------------- */
const formatCurrency = v =>
  v == null || isNaN(+v) ? 'R$ -' : `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

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
    
    // Only call MRT_AggregationFns with a valid array of numbers
    return MRT_AggregationFns.sum(safeVals);
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
    
    // Only call MRT_AggregationFns with a valid array of numbers
    return MRT_AggregationFns.mean(safeVals);
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
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,  setError]    = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [openAdd,  setOpenAdd]  = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editRow,  setEditRow]  = useState(null);
  const [openDel,  setOpenDel]  = useState(false);
  const [delRow,   setDelRow]   = useState(null);

  const [priceAggMode, setPriceAggMode] = useState('mean');     // 'mean' | 'sum'
  const [grouping,      setGrouping]    = useState([]);
  const [pagination,    setPagination]  = useState({ pageIndex: 0, pageSize: 50 });
  const [showQuantity,  setShowQuantity] = useState(false);     // Hide quantity column by default

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
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

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
        
        // Choose aggregation function
        const fn = accessor === 'quantidade_atual'
          ? safeSum
          : priceAggMode === 'mean' ? safeMean : safeSum;
        
        // Calculate label
        const label =
          accessor === 'quantidade_atual'
            ? 'Total: '
            : priceAggMode === 'mean' ? 'Média: ' : 'Soma: ';
        
        // Calculate result safely
        let result;
        try {
          result = fn(vals);
        } catch (e) {
          console.error(`Error calculating ${fn.name} for ${accessor}:`, e);
          result = 0;
        }
        
        // Return formatted result
        return (
          <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
            {label}
            {accessor === 'quantidade_atual'
              ? result
              : formatCurrency(result)}
          </Box>
        );
      } catch (e) {
        console.error('Error in footer function:', e);
        return <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>-</Box>;
      }
    };

    // Define custom aggregation functions that never fail
    const customAggregationFn = (priceAggMode === 'mean' ? safeMean : safeSum);

    const baseColumns = [
      { accessorKey: 'nome', header: 'Nome', size: 180, enableGrouping: true },
      { accessorKey: 'sexo', header: 'Sexo', size: 90, enableGrouping: true },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', size: 130, enableGrouping: true },
      { accessorKey: 'tamanho', header: 'Tamanho', size: 100, enableGrouping: true },
      {
        accessorKey: 'custo',
        header: 'Custo Unit.',
        size: 110,
        // Use custom safe aggregation function
        aggregationFn: customAggregationFn,
        muiTableBodyCellProps:  { align: 'right' },
        muiTableHeadCellProps:  { align: 'right' },
        muiTableFooterCellProps:{ align: 'right' },
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
        AggregatedCell: ({ cell }) => {
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
            console.error('Error in AggregatedCell formatter:', e);
          }
          
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              {priceAggMode === 'mean' ? 'Média: ' : 'Soma: '}
              {formatCurrency(value)}
            </Box>
          );
        },
        Footer: footer('custo'),
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda Unit.',
        size: 120,
        // Use custom safe aggregation function
        aggregationFn: customAggregationFn,
        muiTableBodyCellProps:  { align: 'right' },
        muiTableHeadCellProps:  { align: 'right' },
        muiTableFooterCellProps:{ align: 'right' },
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
        AggregatedCell: ({ cell }) => {
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
            console.error('Error in AggregatedCell formatter:', e);
          }
          
          return (
            <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
              {priceAggMode === 'mean' ? 'Média: ' : 'Soma: '}
              {formatCurrency(value)}
            </Box>
          );
        },
        Footer: footer('preco_venda'),
      },
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', size: 140, enableGrouping: true },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        size: 120,
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
    
    // Conditionally add quantity column if showQuantity is true
    if (showQuantity) {
      baseColumns.splice(4, 0, {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        size: 80,
        // Use safeSum directly
        aggregationFn: safeSum,
        muiTableBodyCellProps:  { align: 'right' },
        muiTableHeadCellProps:  { align: 'right' },
        muiTableFooterCellProps:{ align: 'right' },
        AggregatedCell: ({ cell }) => {
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
      });
    }
    
    return baseColumns;
  }, [priceAggMode, showQuantity]);

  /* --------------- table instance ------------ */
  const table = useMaterialReactTable({
    columns,
    // Ensure data is always an array
    data: Array.isArray(rows) ? rows : [],
    localization: MRT_Localization_PT_BR,
    enableGrouping: true,
    enableStickyHeader: true,
    enableDensityToggle: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    enableTableFooter: true,
    initialState: {
      density: 'compact',
      sorting: [{ id: 'nome', desc: false }],
      pagination,
    },
    state: {
      isLoading: loading,
      showAlertBanner: !!error,
      grouping,
      pagination,
    },
    muiToolbarAlertBannerProps: error ? { color: 'error', children: error } : undefined,
    onGroupingChange:    setGrouping,
    onPaginationChange:  setPagination,
    muiTableContainerProps: { sx: { maxHeight: 650 } },
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => { setEditRow(null); setOpenAdd(true); }}
        >
          Adicionar Produto
        </Button>
        <Tooltip title="Alternar Agregação (Média/Soma)">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={priceAggMode}
            onChange={(_, v) => v && setPriceAggMode(v)}
          >
            <ToggleButton value="mean">
              <MovingIcon fontSize="small" /> Média
            </ToggleButton>
            <ToggleButton value="sum">
              <FunctionsIcon fontSize="small" /> Soma
            </ToggleButton>
          </ToggleButtonGroup>
        </Tooltip>
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => setShowQuantity(!showQuantity)}
        >
          {showQuantity ? 'Ocultar Quantidade' : 'Mostrar Quantidade'}
        </Button>
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
      sx: theme => ({
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        fontWeight: 'bold',
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

  /* --------------- render ---------------- */
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Estoque de produtos
        </Typography>

        {/* Scorecards */}
        <InventoryScorecard products={Array.isArray(rows) ? rows : []} loading={loading} />

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

        {/* confirm delete */}
        <Dialog open={openDel} onClose={() => setOpenDel(false)}>
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
            <Button onClick={() => setOpenDel(false)}>Cancelar</Button>
            <Button
              color="error"
              onClick={async () => {
                try {
                  const response = await authFetch(`/produtos/${delRow?.id}`, { method: 'DELETE' });
                  if (!response || !response.success) {
                    setDeleteError(response?.error || 'Erro ao excluir produto');
                    return;
                  }
                  fetchProdutos();
                  setOpenDel(false);
                } catch (e) {
                  setDeleteError(e?.message || 'Falha ao excluir produto');
                }
              }}
            >
              Excluir
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
