// src/pages/EstoquePage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  MRT_AggregationFns,
} from 'material-react-table';
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
  TableFooter,
  TableRow,
  TableCell,
} from '@mui/material';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddProductModal from '../components/AddProductModal';
import { authFetch } from '../api';

dayjs.extend(isBetween);

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com')
  .replace(/\/$/, '')}/api`;

const formatCurrency = (v) =>
  v == null ? 'R$ 0,00' : `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

const formatDate = (v) => {
  if (!v) return '-';
  const d = dayjs(v);
  return d.isValid() ? d.format('DD/MM/YYYY') : '-';
};

const safeSum = (vals) => {
  const arr = Array.isArray(vals) ? vals.filter((n) => typeof n === 'number' && !isNaN(n)) : [];
  return MRT_AggregationFns.sum(arr);
};

const safeMean = (vals) => {
  const arr = Array.isArray(vals) ? vals.filter((n) => typeof n === 'number' && !isNaN(n)) : [];
  return MRT_AggregationFns.mean(arr);
};

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, i) { console.error('Uncaught error in EstoquePage:', e, i); }
  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Ocorreu um erro ao renderizar a tabela de estoque.
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error.toString()}
            </pre>
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
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [openDel, setOpenDel] = useState(false);
  const [grouping, setGrouping] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [mode, setMode] = useState('mean');

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/produtos/');
      const list = Array.isArray(res.produtos) ? res.produtos : [];
      setProdutos(list.map((p) => ({ id: p.id ?? p.id_produto, ...p })));
      setError(null);
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const columns = useMemo(
    () => [
      { accessorKey: 'nome', header: 'Nome', enableGrouping: true },
      { accessorKey: 'sexo', header: 'Sexo', enableGrouping: true },
      { accessorKey: 'cor_estampa', header: 'Cor/Estampa', enableGrouping: true },
      { accessorKey: 'tamanho', header: 'Tamanho', enableGrouping: true },
      {
        accessorKey: 'quantidade_atual',
        header: 'Qtd.',
        aggregationFn: safeSum,
        AggregatedCell: ({ cell }) => <strong>Total: {cell.getValue()}</strong>,
        Footer: ({ table }) => {
          const rowModel = table.getFilteredRowModel() || { rows: [] };
          const rows = Array.isArray(rowModel.rows) ? rowModel.rows : [];
          const total = rows.reduce((sum, r) => sum + (r.getValue('quantidade_atual') || 0), 0);
          return (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell align="right"><strong>Total: {total}</strong></TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableFooter>
          );
        },
      },
      {
        accessorKey: 'custo',
        header: 'Custo Unit.',
        aggregationFn: mode === 'mean' ? safeMean : safeSum,
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <strong>
            {mode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </strong>
        ),
        Footer: ({ table }) => {
          const rowModel = table.getFilteredRowModel() || { rows: [] };
          const rows = Array.isArray(rowModel.rows) ? rowModel.rows : [];
          const vals = rows.map((r) => Number(r.getValue('custo')) || 0);
          const value = mode === 'mean' ? safeMean(vals) : safeSum(vals);
          return (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} />
                <TableCell align="right">
                  <strong>
                    {mode === 'mean' ? 'Média: ' : 'Soma: '}
                    {formatCurrency(value)}
                  </strong>
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          );
        },
      },
      {
        accessorKey: 'preco_venda',
        header: 'Preço Venda Unit.',
        aggregationFn: mode === 'mean' ? safeMean : safeSum,
        Cell: ({ cell }) => formatCurrency(cell.getValue()),
        AggregatedCell: ({ cell }) => (
          <strong>
            {mode === 'mean' ? 'Média: ' : 'Soma: '}
            {formatCurrency(cell.getValue())}
          </strong>
        ),
        Footer: ({ table }) => {
          const rowModel = table.getFilteredRowModel() || { rows: [] };
          const rows = Array.isArray(rowModel.rows) ? rowModel.rows : [];
          const vals = rows.map((r) => Number(r.getValue('preco_venda')) || 0);
          const value = mode === 'mean' ? safeMean(vals) : safeSum(vals);
          return (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} />
                <TableCell align="right">
                  <strong>
                    {mode === 'mean' ? 'Média: ' : 'Soma: '}
                    {formatCurrency(value)}
                  </strong>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          );
        },
      },
      { accessorKey: 'nome_fornecedor', header: 'Fornecedor', enableGrouping: true },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        Cell: ({ cell }) => formatDate(cell.getValue()),
        filterVariant: 'date-range',
        filterFn: (row, id, filter) => {
          const date = dayjs(row.getValue(id));
          const [start, end] = filter;
          if (start && end) {
            return date.isBetween(
              dayjs(start).startOf('day'),
              dayjs(end).endOf('day'),
              'day',
              '[]'
            );
          } else if (start) {
            return date.isSameOrAfter(dayjs(start).startOf('day'));
          } else if (end) {
            return date.isSameOrBefore(dayjs(end).endOf('day'));
          }
          return true;
        },
      },
    ],
    [mode]
  );

  const mrt = MaterialReactTable.useMaterialReactTable({
    columns,
    data: produtos,
    localization: MRT_Localization_PT_BR,
    enableGrouping: true,
    enableStickyHeader: true,
    enableDensityToggle: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    enableTableFooter: true,
    state: { isLoading: loading, showAlertBanner: !!error, grouping, pagination },
    onGroupingChange: setGrouping,
    onPaginationChange: setPagination,
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => { setEditing(null); setOpenAdd(true); }}
        >
          Adicionar Produto
        </Button>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
        >
          <ToggleButton value="mean">Média</ToggleButton>
          <ToggleButton value="sum">Soma</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    ),
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Editar">
          <IconButton onClick={() => { setEditing(row.original); setOpenEdit(true); }}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            color="error"
            onClick={() => { setDeleting(row.original); setOpenDel(true); }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Estoque de produtos
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MaterialReactTable table={mrt} />
        </LocalizationProvider>
      )}

      <AddProductModal
        open={openAdd || openEdit}
        onClose={() => (openEdit ? setOpenEdit(false) : setOpenAdd(false))}
        onSuccess={() => {
          fetchProdutos();
          setOpenAdd(false);
          setOpenEdit(false);
        }}
        productData={editing}
        isEditMode={!!editing}
      />

      <Dialog open={openDel} onClose={() => setOpenDel(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir "{deleting?.nome}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDel(false)}>Cancelar</Button>
          <Button
            color="error"
            onClick={async () => {
              await authFetch(`/produtos/${deleting.id}`, { method: 'DELETE' });
              fetchProdutos();
              setOpenDel(false);
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default function EstoquePage() {
  return (
    <ErrorBoundary>
      <EstoquePageContent />
    </ErrorBoundary>
  );
}
