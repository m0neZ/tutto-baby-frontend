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
  TableFooter,
  TableRow,
  TableCell,
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
import { apiFetch } from '../api';

dayjs.extend(isBetween);

// Formatting helpers
const formatCurrency = (value) => {
  if (value == null) return 'R$ 0,00';
  const num = Number(value);
  if (isNaN(num)) return 'R$ -';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};
const formatDate = (value) => {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD/MM/YYYY') : '-';
};
const safeSum = (vals) =>
  MRT_AggregationFns.sum(vals.filter((n) => typeof n === 'number'));
const safeMean = (vals) =>
  MRT_AggregationFns.mean(vals.filter((n) => typeof n === 'number'));

// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Uncaught error in EstoquePage:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Ocorreu um erro ao renderizar a tabela de estoque.
            <pre>{this.state.error.toString()}</pre>
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
  const [openAddModal, setOpenAddModal] = useState(false);
  const [grouping, setGrouping] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [priceAggregationMode, setPriceAggregationMode] = useState('mean');
  const [editingProduct, setEditingProduct] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/produtos/');
      const list = data.produtos || [];
      setProdutos(list.map((p) => ({ id: p.id ?? p.id_produto, ...p })));
      setError(null);
    } catch (e) {
      setError(`Falha ao carregar produtos: ${e.message}`);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  const columns = useMemo(() => [
    { accessorKey: 'nome', header: 'Nome', size: 180, enableGrouping: true, muiTableHeadCellProps: { align: 'left' } },
    { accessorKey: 'sexo', header: 'Sexo', size: 90, enableGrouping: true },
    { accessorKey: 'cor_estampa', header: 'Cor/Estampa', size: 130, enableGrouping: true },
    { accessorKey: 'tamanho', header: 'Tamanho', size: 100, enableGrouping: true },
    {
      accessorKey: 'quantidade_atual', header: 'Qtd.', size: 80,
      aggregationFn: safeSum,
      AggregatedCell: ({ cell }) => (<Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>Total: {cell.getValue()}</Box>),
      Footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + row.getValue('quantidade_atual'), 0);
        return (<Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>Total: {total}</Box>);
      },
      muiTableBodyCellProps: { align: 'right' }, muiTableHeadCellProps: { align: 'right' }, muiTableFooterCellProps: { align: 'right' },
    },
    {
      accessorKey: 'custo', header: 'Custo Unit.', size: 110,
      aggregationFn: priceAggregationMode === 'mean' ? safeMean : safeSum,
      Cell: ({ cell }) => formatCurrency(cell.getValue()),
      AggregatedCell: ({ cell }) => (<Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>{priceAggregationMode==='mean'?'Média: ':'Soma: '}{formatCurrency(cell.getValue())}</Box>),
      Footer: ({ table }) => {
        const vals = table.getFilteredRowModel().rows.map(r => r.getValue('custo'));
        const value = priceAggregationMode==='mean'? safeMean(vals): safeSum(vals);
        return (<Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>{priceAggregationMode==='mean'?'Média: ':'Soma: '}{formatCurrency(value)}</Box>);
      },
      muiTableBodyCellProps: { align: 'right' }, muiTableHeadCellProps: { align: 'right' }, muiTableFooterCellProps: { align: 'right' },
    },
    {
      accessorKey: 'preco_venda', header: 'Preço Venda Unit.', size: 120,
      aggregationFn: priceAggregationMode === 'mean' ? safeMean : safeSum,
      Cell: ({ cell }) => formatCurrency(cell.getValue()),
      AggregatedCell: ({ cell }) => (<Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>{priceAggregationMode==='mean'?'Média: ':'Soma: '}{formatCurrency(cell.getValue())}</Box>),
      Footer: ({ table }) => {
        const vals = table.getFilteredRowModel().rows.map(r => r.getValue('preco_venda'));
        const value = priceAggregationMode==='mean'? safeMean(vals): safeSum(vals);
        return (<Box sx={{ textAlign: 'right', fontWeight: 'bold' }}>{priceAggregationMode==='mean'?'Média: ':'Soma: '}{formatCurrency(value)}</Box>);
      },
      muiTableBodyCellProps: { align: 'right' }, muiTableHeadCellProps: { align: 'right' }, muiTableFooterCellProps: { align: 'right' },
    },
    { accessorKey: 'nome_fornecedor', header: 'Fornecedor', size: 140, enableGrouping: true },
    {
      accessorKey: 'data_compra', header: 'Data Compra', size: 120,
      Cell: ({ cell }) => formatDate(cell.getValue()),
      filterVariant: 'date-range', filterFn: (row,id,filter) => {
        const d = dayjs(row.getValue(id)); const [s,e]=filter;
        return (!s||d.isAfter(dayjs(s).startOf('day')))&&(!e||d.isBefore(dayjs(e).endOf('day')));
      },
    },
  ], [priceAggregationMode]);

  const table = useMaterialReactTable({
    columns, data: produtos, localization: MRT_Localization_PT_BR,
    enableGrouping: true, enableStickyHeader: true, enableDensityToggle: false,
    enableRowActions: true, positionActionsColumn: 'last', enableTableFooter: true,
    state: { isLoading: loading, showAlertBanner: !!error, grouping, pagination },
    onGroupingChange: setGrouping, onPaginationChange: setPagination,
    muiToolbarAlertBannerProps: error? { color:'error', children:error }: undefined,
    muiTableContainerProps:{ sx:{ maxHeight:'650px' } },
    renderTopToolbarCustomActions:()=>(
      <Box sx={{ display:'flex', gap:1 }}>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={()=>{ setEditingProduct(null); setOpenAddModal(true); }}>
          Adicionar Produto
        </Button>
        <ToggleButtonGroup value={priceAggregationMode} exclusive onChange={(_,v)=>v&&setPriceAggregationMode(v)}>
          <ToggleButton value="mean"><MovingIcon/> Média</ToggleButton>
          <ToggleButton value="sum"><FunctionsIcon/> Soma</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    ),
    renderRowActions:({row})=>(
      <Box sx={{ display:'flex', gap:0.5, justifyContent:'center' }}>
        <IconButton onClick={()=>{ setEditingProduct(row.original); setOpenEditModal(true); }}><EditIcon/></IconButton>
        <IconButton color="error" onClick={()=>{ setDeletingProduct(row.original); setOpenConfirmDelete(true); }}><DeleteIcon/></IconButton>
      </Box>
    ),
    muiTableHeadCellProps:{ sx: theme=>({ backgroundColor: theme.palette.secondary.main, color: theme.palette.secondary.contrastText }) },
    muiTableBodyProps:{ sx: theme=>({ '& tr:nth-of-type(odd)>td':{ backgroundColor: theme.palette.background.paper }} ) },
    muiTableFooterProps:{ sx: theme=>({ backgroundColor: theme.palette.grey[200], '& td':{ fontWeight:'bold' } }) },
    muiTablePaperProps:{ elevation:1, sx:{ border:'1px solid', borderColor:'divider' } },
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb:2, color:'primary.main', fontWeight:'bold' }}>
        Estoque de produtos
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress/> : (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MaterialReactTable table={table} />
        </LocalizationProvider>
      )}

      <AddProductModal
        open={openAddModal || openEditModal}
        onClose={() => { openEditModal? setOpenEditModal(false): setOpenAddModal(false); }}
        onSuccess={() => { setOpenAddModal(false); setOpenEditModal(false); fetchProdutos(); }}
        productData={editingProduct}
        isEditMode={!!editingProduct}
      />
      <Dialog open={openConfirmDelete} onClose={()=>setOpenConfirmDelete(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent><DialogContentText>Tem certeza que deseja excluir "{deletingProduct?.nome}"?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenConfirmDelete(false)}>Cancelar</Button>
          <Button onClick={async()=>{ await apiFetch(`/produtos/${deletingProduct.id}`,{method:'DELETE'}); fetchProdutos(); setOpenConfirmDelete(false); }} color="error">Excluir</Button>
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
