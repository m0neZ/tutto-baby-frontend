import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// Import TanStack Table hooks and utilities
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table';

// Import the AddProductModal component
import AddProductModal from '../components/AddProductModal';

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

// Helper component for column filtering (unchanged)
function Filter({ column, table }) {
  const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);

  return typeof firstValue === 'number' ? (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <TextField
        size="small"
        type="number"
        value={(column.getFilterValue()?.[0] ?? '')}
        onChange={e =>
          column.setFilterValue((old) => [e.target.value, old?.[1]])
        }
        placeholder={`Min`}
        sx={{ width: '70px' }}
        variant="standard"
      />
      <TextField
        size="small"
        type="number"
        value={(column.getFilterValue()?.[1] ?? '')}
        onChange={e =>
          column.setFilterValue((old) => [old?.[0], e.target.value])
        }
        placeholder={`Max`}
        sx={{ width: '70px' }}
        variant="standard"
      />
    </Box>
  ) : (
    <TextField
      size="small"
      value={(column.getFilterValue() ?? '')}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Buscar...`}
      variant="standard"
      sx={{ width: '100%' }}
    />
  );
}

const EstoquePage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false); // State for modal

  // TanStack Table state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [grouping, setGrouping] = useState(['cor_estampa']); // Default grouping
  const [expanded, setExpanded] = useState({}); // State for expanded rows
  const [aggregationFn, setAggregationFn] = useState('sum'); // Default aggregation

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/produtos/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const fetchedProdutos = data.produtos || (data.success && data.produtos) || [];
      setProdutos(fetchedProdutos);
      console.log("[ESTOQUE DEBUG] Fetched products:", fetchedProdutos);
    } catch (e) {
      console.error("Error fetching products:", e);
      setError('Falha ao carregar produtos. Verifique a conexão com o backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Define columns for TanStack Table with grouping and aggregation
  const columns = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: info => info.getValue(),
      aggregatedCell: ({ row }) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {row.subRows.length} Itens
        </Typography>
      ),
    },
    {
      accessorKey: 'sexo',
      header: 'Sexo',
      cell: info => info.getValue(),
      enableGrouping: true,
    },
    {
      accessorKey: 'cor_estampa',
      header: 'Cor/Estampa',
      cell: info => info.getValue(),
      enableGrouping: true,
    },
    {
      accessorKey: 'tamanho',
      header: 'Tamanho',
      cell: info => info.getValue(),
      enableGrouping: true,
    },
    {
      accessorKey: 'quantidade_atual',
      header: 'Qtd.',
      cell: info => info.getValue(),
      aggregationFn: 'sum', // Always sum quantity
      aggregatedCell: info => info.getValue(),
    },
    {
      accessorKey: 'custo',
      header: 'Custo',
      cell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
      aggregationFn: aggregationFn, // Use selected aggregation ('sum' or 'mean')
      aggregatedCell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
    },
    {
      accessorKey: 'preco_venda',
      header: 'Preço Venda',
      cell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
      aggregationFn: aggregationFn, // Use selected aggregation ('sum' or 'mean')
      aggregatedCell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
    },
    {
      accessorKey: 'nome_fornecedor',
      header: 'Fornecedor',
      cell: info => info.getValue() ?? '-', 
      enableGrouping: true,
    },
    {
      accessorKey: 'data_compra',
      header: 'Data Compra',
      cell: info => info.getValue() ? new Date(info.getValue()).toLocaleDateString("pt-BR") : '-', 
      enableSorting: true, // *** FIX: Enable sorting for Data Compra ***
      enableColumnFilter: false, // Keep filter disabled for simplicity
      enableGrouping: true, // *** FIX: Enable grouping for Data Compra ***
    },
  ], [aggregationFn]); // Re-run memo if aggregationFn changes

  // Initialize TanStack Table instance with grouping and expansion
  const table = useReactTable({
    data: produtos,
    columns,
    state: {
      columnFilters,
      globalFilter,
      sorting,
      grouping,
      expanded,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(), 
    getExpandedRowModel: getExpandedRowModel(), 
    debugTable: true, 
  });

  const handleOpenAddModal = () => {
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleProductAdded = () => {
    handleCloseAddModal();
    fetchProdutos(); // Refresh the product list
  };

  const handleAggregationChange = (event, newAggFn) => {
    if (newAggFn !== null) {
      setAggregationFn(newAggFn);
    }
  };

  // *** FIX: Define allowed grouping columns ***
  const allowedGroupingColumns = ['cor_estampa', 'sexo', 'tamanho', 'nome_fornecedor', 'data_compra'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header and Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Estoque de Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ textTransform: 'none' }}
          onClick={handleOpenAddModal}
        >
          Adicionar Produto
        </Button>
      </Box>

      {/* Filters and Grouping Controls */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
        {/* Global Filter */}
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Buscar em toda a tabela..."
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        {/* Grouping Selector */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="group-by-label">Agrupar Por</InputLabel>
          <Select
            labelId="group-by-label"
            value={grouping[0] || ''} // Assuming single column grouping
            label="Agrupar Por"
            onChange={(e) => setGrouping(e.target.value ? [e.target.value] : [])}
          >
            <MenuItem value=""><em>Nenhum</em></MenuItem>
            {/* *** FIX: Filter columns for grouping dropdown *** */}
            {table.getAllLeafColumns()
              .filter(col => col.getCanGroup() && allowedGroupingColumns.includes(col.id))
              .map(col => (
                <MenuItem key={col.id} value={col.id}>
                  {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Aggregation Method Selector */}
        <ToggleButtonGroup
          color="primary"
          value={aggregationFn}
          exclusive
          onChange={handleAggregationChange}
          aria-label="aggregation method"
          size="small"
        >
          <ToggleButton value="sum">Soma</ToggleButton>
          <ToggleButton value="mean">Média</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Loading and Error States */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Products Table using TanStack Table */}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 650 }} aria-label="estoque table">
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      sortDirection={header.column.getIsSorted()}
                      sx={{ fontWeight: 'bold' }} 
                    >
                      {header.isPlaceholder ? null : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: header.column.getCanSort() ? 'pointer' : 'default',
                          }}
                          onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <TableSortLabel
                              active={!!header.column.getIsSorted()}
                              direction={header.column.getIsSorted() || 'asc'}
                              sx={{ '& .MuiTableSortLabel-icon': { opacity: 0.7 } }} 
                            />
                          )}
                        </Box>
                      )}
                      {header.column.getCanFilter() ? (
                        <Box sx={{ mt: 1 }}>
                          <Filter column={header.column} table={table} />
                        </Box>
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      ...(row.getIsGrouped() && { bgcolor: 'grey.100' }), 
                    }}
                  >
                    {row.getVisibleCells().map(cell => {
                      const context = cell.getContext(); // Get context once
                      return (
                        <TableCell 
                          key={cell.id}
                          sx={{ 
                            ...(cell.getIsGrouped() && { 
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }),
                            ...(cell.getIsAggregated() && { 
                              fontWeight: 'bold',
                              color: 'text.secondary'
                            }),
                            ...(cell.getIsPlaceholder() && !cell.getIsAggregated() && { 
                              bgcolor: 'grey.100' 
                            }),
                          }}
                          onClick={cell.getIsGrouped() ? row.getToggleExpandedHandler() : undefined}
                        >
                          {cell.getIsGrouped() ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); row.toggleExpanded(); }} sx={{ p: 0 }}>
                                {row.getIsExpanded() ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                              </IconButton>
                              {flexRender(cell.column.columnDef.cell, context)} ({row.subRows.length})
                            </Box>
                          ) : cell.getIsAggregated() ? (
                            flexRender(
                              cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                              context
                            )
                          ) : cell.getIsPlaceholder() ? null : (
                            flexRender(
                              cell.column.columnDef.cell,
                              context
                            )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Nenhum produto encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Render the AddProductModal */}
      <AddProductModal 
        open={openAddModal} 
        onClose={handleCloseAddModal} 
        onSuccess={handleProductAdded} 
      />

    </Container>
  );
};

export default EstoquePage;

