// File: src/pages/EstoquePage.jsx
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
import { authFetch } from '../api';           // <-- ✅  authenticated fetch

dayjs.extend(isBetween);

/* ---------------- helpers ---------------- */
const formatCurrency = v =>
  v == null || isNaN(+v) ? 'R$ -' : `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

const formatDate = v =>
  v ? (dayjs(v).isValid() ? dayjs(v).format('DD/MM/YYYY') : '-') : '-';

const onlyNums = arr =>
  (Array.isArray(arr) ? arr : []).filter(n => typeof n === 'number' && !Number.isNaN(n));

const safeSum  = vals => MRT_AggregationFns.sum (onlyNums(vals));
const safeMean = vals => MRT_AggregationFns.mean(onlyNums(vals));

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

  const [openAdd,  setOpenAdd]  = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editRow,  setEditRow]  = useState(null);
  const [openDel,  setOpenDel]  = useState(false);
  const [delRow,   setDelRow]   = useState(null);

  const [priceAggMode, setPriceAggMode] = useState('mean');     // 'mean' | 'sum'
  const [grouping,      setGrouping]    = useState([]);
  const [pagination,    setPagination]  = useState({ pageIndex: 0, pageSize: 50 });

  /* ---------- fetch products (auth) ---------- */
  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authFetch('/produtos/');               // <-- ✅
      const list = data?.produtos ?? [];
      setRows(list.map(p => ({ ...p, id: p.id ?? p.id_produto })));
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
    const footer = accessor => ({ table }) => {
      const vals =
        (table.getFilteredRowModel()?.rows ?? []).map(r => r.getValue(accessor));
      const fn  = accessor === 'quantidade_atual'
        ? safeSum
        : priceAggMode === 'mean' ? safeMean : safeSum;
      const label =
        accessor === 'quantidade_atual'
          ? 'Total: '
          : priceAggMode === 'mean' ? 'Média: ' : 'Soma: ';
      return (
        <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
          {label}
          {accessor === 'quantidade_atual'
            ? fn(vals)
            : formatCurrency(fn(vals))}
        </Box>
      );
    };

    return [
      { accessorKey: 'nome', header: 'Nome', size: 180, enableGrouping: true },
      { accessorKey: 'sexo', header: 'Sexo', size: 90, enableGrouping: true },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', size: 130, enableGrouping: true },
      { accessorKey: 'tamanho', header: 'Tamanho', size: 100, enableGrouping: true },
      {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        size: 80,
        aggregationFn: safeSum,
        muiTableBodyCellProps:  { align: 'right' },
        muiTableHeadCellProps:  { align: 'right' },
        muiTableFooterCellProps:{ align: 'right' },
        AggregatedCell: ({ cell }) => (
          <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
            Total: {cell.getValue()}
          </Box>
        ),
        Footer: footer('quantidade_atual'),
      },
      {
        accessorKey: 'custo',
        header: 'Custo Unit.',
        size: 110,
        aggregationFn: priceAggMode === 'mean' ? safeMean : safeSum,
        muiTableBodyCellProps:  { align: 'right' },
        muiTableHeadCellProps:  { align: 'right' },
        muiTableFooterCellProps:{ align: 'right' },
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
            {priceAggMode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </Box>
        ),
        Footer: footer('custo'),
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda Unit.',
        size: 120,
        aggregationFn: priceAggMode === 'mean' ? safeMean : safeSum,
        muiTableBodyCellProps:  { align: 'right' },
        muiTableHeadCellProps:  { align: 'right' },
        muiTableFooterCellProps:{ align: 'right' },
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>
            {priceAggMode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </Box>
        ),
        Footer: footer('preco_venda'),
      },
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', size: 140, enableGrouping: true },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        size: 120,
        Cell: ({ cell }) => formatDate(cell.getValue()),
        filterVariant: 'date-range',
        filterFn: (row, id, [start, end]) => {
          const d = dayjs(row.getValue(id));
          if (!d.isValid()) return false;
          if (start && end) return d.isBetween(dayjs(start).startOf('day'), dayjs(end).endOf('day'), 'day', '[]');
          if (start) return d.isSameOrAfter(dayjs(start).startOf('day'));
          if (end)   return d.isSameOrBefore (dayjs(end).endOf('day'));
          return true;
        },
      },
    ];
  }, [priceAggMode]);

  /* --------------- table instance ------------ */
  const table = useMaterialReactTable({
    columns,
    data: rows,
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
            onClick={() => { setDelRow(row.original); setOpenDel(true); }}
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDel(false)}>Cancelar</Button>
            <Button
              color="error"
              onClick={async () => {
                try {
                  await authFetch(`/produtos/${delRow.id}`, { method: 'DELETE' }); // <-- ✅
                  fetchProdutos();
                } catch (e) {
                  setError(`Falha ao excluir: ${e.message}`);
                } finally {
                  setOpenDel(false);
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
