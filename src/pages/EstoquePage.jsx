// -------- src/pages/EstoquePage.jsx --------
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,    // ✅ the hook that drives the table
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
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FunctionsIcon from '@mui/icons-material/Functions';
import MovingIcon from '@mui/icons-material/Moving';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import AddProductModal from '../components/AddProductModal';
import { authFetch } from '../api';

dayjs.extend(isBetween);

/* ---------- helpers ---------- */
const formatCurrency = (val) => {
  const n = Number(val);
  if (isNaN(n)) return 'R$ -';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
};
const formatDate = (val) => (val ? dayjs(val).format('DD/MM/YYYY') : '-');

/* aggregation safety wrappers */
const safeSum  = (arr) => MRT_AggregationFns.sum(arr?.filter((v) => typeof v === 'number') ?? []);
const safeMean = (arr) => MRT_AggregationFns.mean(arr?.filter((v) => typeof v === 'number') ?? []);

/* ---------- error boundary ---------- */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(err) { return { hasError: true, error: err }; }
  componentDidCatch(err, info) { console.error('EstoquePage crash', err, info); }
  render() {
    return this.state.hasError ? (
      <Alert severity="error" sx={{ mt: 4 }}>
        Ocorreu um erro ao renderizar a tabela de estoque.
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
      </Alert>
    ) : this.props.children;
  }
}

/* ---------- main component ---------- */
function EstoquePageContent() {
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [grouping,    setGrouping]    = useState([]);
  const [pagination,  setPagination]  = useState({ pageIndex: 0, pageSize: 50 });
  const [priceMode,   setPriceMode]   = useState('mean');          // mean | sum
  const [openAdd,     setOpenAdd]     = useState(false);
  const [openEdit,    setOpenEdit]    = useState(false);
  const [editingRow,  setEditingRow]  = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteRow,   setDeleteRow]   = useState(null);

  /* ---- data fetch ---- */
  const getRows = useCallback(async () => {
    setLoading(true);
    try {
      const { produtos = [] } = await authFetch('/produtos/', { method: 'GET' });
      setRows(
        produtos.map((p) => ({ ...p, id: p.id ?? p.id_produto })) // guarantee id
      );
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { getRows(); }, [getRows]);

  /* ---- columns ---- */
  const columns = useMemo(() => [{
    accessorKey: 'nome',  header: 'Nome',            size: 180, enableGrouping: true,
  }, {
    accessorKey: 'sexo',  header: 'Sexo',            size:  90, enableGrouping: true,
  }, {
    accessorKey: 'cor_estampa', header: 'Cor/Estampa', size: 130, enableGrouping: true,
  }, {
    accessorKey: 'tamanho', header: 'Tamanho',       size: 100, enableGrouping: true,
  }, {
    accessorKey: 'quantidade_atual',
    header: 'Qtd.',
    size: 80,
    enableHiding: true,                 // ← stays hide-able
    aggregationFn: safeSum,
    AggregatedCell: ({ cell }) => <Box sx={{ textAlign:'right', fontWeight:600 }}>Total &nbsp;{cell.getValue()}</Box>,
    Footer: ({ table }) => {
      const total = safeSum(table.getFilteredRowModel().rows.map(r => r.getValue('quantidade_atual')));
      return <Box sx={{ textAlign:'right', fontWeight:600 }}>Total &nbsp;{total}</Box>;
    },
    muiTableBodyCellProps: { align:'right' },
    muiTableHeadCellProps: { align:'right' },
    muiTableFooterCellProps: { align:'right' },
  }, {
    accessorKey: 'custo',
    header: 'Custo Unit.',
    size: 110,
    aggregationFn: priceMode === 'mean' ? safeMean : safeSum,
    Cell: ({ cell }) => formatCurrency(cell.getValue()),
    AggregatedCell: ({ cell }) => (
      <Box sx={{ textAlign:'right', fontWeight:600 }}>
        {priceMode === 'mean' ? 'Média: ' : 'Soma: '}
        {formatCurrency(cell.getValue())}
      </Box>
    ),
    Footer: ({ table }) => {
      const vals = table.getFilteredRowModel().rows.map(r => r.getValue('custo'));
      return (
        <Box sx={{ textAlign:'right', fontWeight:600 }}>
          {priceMode === 'mean' ? 'Média: ' : 'Soma: '}
          {formatCurrency(priceMode === 'mean' ? safeMean(vals) : safeSum(vals))}
        </Box>
      );
    },
    muiTableBodyCellProps: { align:'right' },
    muiTableHeadCellProps: { align:'right' },
    muiTableFooterCellProps: { align:'right' },
  }, {
    accessorKey: 'preco_venda',
    header: 'Preço Venda Unit.',
    size: 120,
    aggregationFn: priceMode === 'mean' ? safeMean : safeSum,
    Cell: ({ cell }) => formatCurrency(cell.getValue()),
    AggregatedCell: ({ cell }) => (
      <Box sx={{ textAlign:'right', fontWeight:600 }}>
        {priceMode === 'mean' ? 'Média: ' : 'Soma: '}
        {formatCurrency(cell.getValue())}
      </Box>
    ),
    Footer: ({ table }) => {
      const vals = table.getFilteredRowModel().rows.map(r => r.getValue('preco_venda'));
      return (
        <Box sx={{ textAlign:'right', fontWeight:600 }}>
          {priceMode === 'mean' ? 'Média: ' : 'Soma: '}
          {formatCurrency(priceMode === 'mean' ? safeMean(vals) : safeSum(vals))}
        </Box>
      );
    },
    muiTableBodyCellProps: { align:'right' },
    muiTableHeadCellProps: { align:'right' },
    muiTableFooterCellProps: { align:'right' },
  }, {
    accessorKey: 'nome_fornecedor',
    header: 'Fornecedor',
    size: 140,
    enableGrouping: true,
  }, {
    accessorKey: 'data_compra',
    header: 'Data Compra',
    size: 120,
    Cell: ({ cell }) => formatDate(cell.getValue()),
    filterVariant: 'date-range',
    filterFn: (row, id, [start, end]) => {
      const d = dayjs(row.getValue(id));
      if (!d.isValid()) return false;
      if (start && end) return d.isBetween(start, end, 'day', '[]');
      if (start)        return d.isSameOrAfter(start, 'day');
      if (end)          return d.isSameOrBefore(end, 'day');
      return true;
    },
  }], [priceMode]);

  /* ---- table instance ---- */
  const table = useMaterialReactTable({
    columns,
    data: rows,
    localization: MRT_Localization_PT_BR,
    enableGrouping       : true,
    enableStickyHeader   : true,
    enableDensityToggle  : false,
    enableRowActions     : true,
    positionActionsColumn: 'last',
    enableTableFooter    : true,
    initialState: {
      density     : 'compact',
      sorting     : [{ id:'nome', desc:false }],
      pagination  : pagination,
      grouping    : grouping,
      columnPinning: { right:['mrt-row-actions'] },
    },
    state: {
      isLoading        : loading,
      showAlertBanner  : !!error,
      grouping,
      pagination,
    },
    onGroupingChange  : setGrouping,
    onPaginationChange: setPagination,
    muiToolbarAlertBannerProps: error ? { color:'error', children:error } : undefined,

    muiTableHeadCellProps: {
      sx: (theme) => ({
        backgroundColor: theme.palette.secondary.main,
        color          : theme.palette.secondary.contrastText,
        fontWeight     : 'bold',
      }),
    },
    muiTableBodyProps: {
      sx: (theme) => ({
        '& tr:nth-of-type(odd)  > td': { backgroundColor: theme.palette.background.paper  },
        '& tr:nth-of-type(even) > td': { backgroundColor: theme.palette.action.hover      },
      }),
    },
    muiTablePaperProps: { elevation:1, sx:{ borderRadius:0, border:'1px solid', borderColor:'divider' } },
    muiTableFooterProps: { sx:(t)=>({ backgroundColor:t.palette.grey[200], '& td':{ fontWeight:'bold' }}) },

    renderTopToolbarCustomActions: () => (
      <Box sx={{ display:'flex', gap:1 }}>
        <Button
          startIcon={<AddCircleOutlineIcon/>}
          variant="contained"
          onClick={()=>{ setEditingRow(null); setOpenAdd(true); }}
        >
          Adicionar Produto
        </Button>

        <Tooltip title="Alternar cálculo de preços">
          <ToggleButtonGroup
            size="small"
            value={priceMode}
            exclusive
            onChange={(_,v)=>v && setPriceMode(v)}
          >
            <ToggleButton value="mean"><MovingIcon fontSize="small"/> Média</ToggleButton>
            <ToggleButton value="sum" ><FunctionsIcon fontSize="small"/> Soma</ToggleButton>
          </ToggleButtonGroup>
        </Tooltip>
      </Box>
    ),

    renderRowActions: ({ row }) => (
      <Box sx={{ display:'flex', gap:.5, justifyContent:'center' }}>
        <Tooltip title="Editar">
          <IconButton size="small" onClick={()=>{ setEditingRow(row.original); setOpenEdit(true); }}>
            <EditIcon fontSize="small"/>
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton size="small" color="error" onClick={()=>{ setDeleteRow(row.original); setOpenConfirm(true); }}>
            <DeleteIcon fontSize="small"/>
          </IconButton>
        </Tooltip>
      </Box>
    ),
  });

  /* ---- ui ---- */
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt:4, mb:4 }}>
        <Typography variant="h4" gutterBottom>Estoque de produtos</Typography>

        {loading && <CircularProgress/>}
        {!!error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

        {!loading && !error && <MaterialReactTable table={table}/>}

        {/* add / edit modal */}
        <AddProductModal
          open={openAdd || openEdit}
          productData={editingRow}
          isEditMode={!!editingRow}
          onClose={()=>{ setOpenAdd(false); setOpenEdit(false);} }
          onSuccess={()=>{ setOpenAdd(false); setOpenEdit(false); getRows(); }}
        />

        {/* delete confirm */}
        <Dialog open={openConfirm} onClose={()=>setOpenConfirm(false)}>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja excluir "{deleteRow?.nome}"?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setOpenConfirm(false)}>Cancelar</Button>
            <Button
              color="error"
              onClick={async()=>{
                try {
                  await authFetch(`/produtos/${deleteRow.id}`, { method:'DELETE' });
                  getRows();
                } catch(e) { alert(e.message); }
                setOpenConfirm(false);
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

export default function EstoquePage() {
  return (
    <ErrorBoundary>
      <EstoquePageContent />
    </ErrorBoundary>
  );
}
