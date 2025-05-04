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
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Popover from '@mui/material/Popover';
import FilterListIcon from '@mui/icons-material/FilterList';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table';

import AddProductModal from '../components/AddProductModal';

const API_BASE = `${(import.meta.env?.VITE_API_URL || 'https://tutto-baby-backend.onrender.com').replace(/\/$/, '')}/api`;

// Helper component for Date Range Filtering
function DateRangeColumnFilter({ column, isActive }) {
  const filterValue = column?.getFilterValue();
  const [startDate, setStartDate] = useState(filterValue?.[0] || '');
  const [endDate, setEndDate] = useState(filterValue?.[1] || '');

  useEffect(() => {
    if (column) {
        const currentFilterValue = column.getFilterValue();
        setStartDate(currentFilterValue?.[0] || '');
        setEndDate(currentFilterValue?.[1] || '');
    }
  }, [column, filterValue]);

  if (!column || !isActive) return null;

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    column.setFilterValue([newStartDate || undefined, endDate || undefined]);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    column.setFilterValue([startDate || undefined, newEndDate || undefined]);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1 }}>
      <TextField
        label="De"
        type="date"
        size="small"
        variant="outlined"
        value={startDate}
        onChange={handleStartDateChange}
        InputLabelProps={{ shrink: true }}
        sx={{ width: '150px' }}
      />
      <TextField
        label="Até"
        type="date"
        size="small"
        variant="outlined"
        value={endDate}
        onChange={handleEndDateChange}
        InputLabelProps={{ shrink: true }}
        sx={{ width: '150px' }}
      />
    </Box>
  );
}

// Helper component for general column filtering
function Filter({ column, isActive }) {
  if (!column || !isActive) return null;

  const firstValue = column.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);
  const filterValue = column.getFilterValue();

  return typeof firstValue === 'number' ? (
    <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
      <TextField
        size="small"
        type="number"
        value={(filterValue?.[0] ?? '')}
        onChange={e =>
          column.setFilterValue((old) => [e.target.value, old?.[1]])
        }
        placeholder={`Min`}
        sx={{ width: '80px' }}
        variant="outlined"
      />
      <TextField
        size="small"
        type="number"
        value={(filterValue?.[1] ?? '')}
        onChange={e =>
          column.setFilterValue((old) => [old?.[0], e.target.value])
        }
        placeholder={`Max`}
        sx={{ width: '80px' }}
        variant="outlined"
      />
    </Box>
  ) : (
    <TextField
      size="small"
      value={(filterValue ?? '')}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Buscar ${typeof column.columnDef.header === 'string' ? column.columnDef.header : ''}...`}
      variant="outlined"
      sx={{ width: '100%', p: 1 }}
    />
  );
}

// Custom filter function for date range
const dateBetweenFilterFn = (row, columnId, filterValue) => {
  const rowValue = row.getValue(columnId);
  const [start, end] = filterValue || [];
  if (!rowValue) return false;
  let rowDateStr;
  try {
    rowDateStr = new Date(rowValue).toISOString().split('T')[0];
  } catch (e) {
    return false;
  }
  const startDateStr = start ? start : null;
  const endDateStr = end ? end : null;
  if (startDateStr && rowDateStr < startDateStr) return false;
  if (endDateStr && rowDateStr > endDateStr) return false;
  return true;
};

const EstoquePage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [currentFilterColumnId, setCurrentFilterColumnId] = useState(null);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [grouping, setGrouping] = useState(['cor_estampa']);
  const [expanded, setExpanded] = useState({});
  const [aggregationFn, setAggregationFn] = useState('sum');

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
    } catch (e) {
      setError('Falha ao carregar produtos. Verifique a conexão com o backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

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
      enableColumnFilter: true,
      size: 200, // Give Nome more space
    },
    {
      accessorKey: 'sexo',
      header: 'Sexo',
      cell: info => info.getValue(),
      enableGrouping: true,
      enableColumnFilter: true,
      size: 80,
    },
    {
      accessorKey: 'cor_estampa',
      header: 'Cor/Estampa',
      cell: info => info.getValue(),
      enableGrouping: true,
      enableColumnFilter: true,
      size: 150,
    },
    {
      accessorKey: 'tamanho',
      header: 'Tamanho',
      cell: info => info.getValue(),
      enableGrouping: true,
      enableColumnFilter: true,
      size: 100,
    },
    {
      accessorKey: 'quantidade_atual',
      header: 'Qtd.',
      cell: info => info.getValue(),
      aggregationFn: 'sum',
      aggregatedCell: info => info.getValue(),
      enableColumnFilter: true,
      filterFn: 'inNumberRange',
      size: 60,
    },
    {
      accessorKey: 'custo',
      header: 'Custo',
      cell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
      aggregationFn: aggregationFn,
      aggregatedCell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
      enableColumnFilter: true,
      filterFn: 'inNumberRange',
      size: 100,
    },
    {
      accessorKey: 'preco_venda',
      header: 'Preço Venda',
      cell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
      aggregationFn: aggregationFn,
      aggregatedCell: info => `R$ ${info.getValue()?.toFixed(2) ?? '0.00'}`, 
      enableColumnFilter: true,
      filterFn: 'inNumberRange',
      size: 110,
    },
    {
      accessorKey: 'nome_fornecedor',
      header: 'Fornecedor',
      cell: info => info.getValue() ?? '-', 
      enableGrouping: true,
      enableColumnFilter: true,
      size: 150,
    },
    {
      accessorKey: 'data_compra',
      header: 'Data Compra',
      cell: info => info.getValue() ? new Date(info.getValue()).toLocaleDateString("pt-BR") : '-', 
      enableSorting: true, 
      enableGrouping: true, 
      enableColumnFilter: true,
      filterFn: dateBetweenFilterFn,
      size: 120,
    },
  ], [aggregationFn]);

  const table = useReactTable({
    data: produtos,
    columns,
    filterFns: {
      dateBetween: dateBetweenFilterFn,
    },
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
    debugTable: false,
  });

  const handleFilterIconClick = (event, columnId) => {
    setFilterAnchorEl(event.currentTarget);
    setCurrentFilterColumnId(columnId);
  };

  const handleFilterPopoverClose = () => {
    setFilterAnchorEl(null);
    setCurrentFilterColumnId(null);
  };

  const openFilterPopover = Boolean(filterAnchorEl);
  const filterPopoverId = openFilterPopover ? 'filter-popover' : undefined;

  const currentFilterColumn = useMemo(() => 
    table.getAllLeafColumns().find(col => col.id === currentFilterColumnId)
  , [currentFilterColumnId, table]);

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleProductAdded = () => {
    handleCloseAddModal();
    fetchProdutos();
  };
  const handleAggregationChange = (event, newAggFn) => {
    if (newAggFn !== null) setAggregationFn(newAggFn);
  };
  const allowedGroupingColumns = ['cor_estampa', 'sexo', 'tamanho', 'nome_fornecedor', 'data_compra'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="group-by-label">Agrupar Por</InputLabel>
          <Select
            labelId="group-by-label"
            value={grouping[0] || ''}
            label="Agrupar Por"
            onChange={(e) => setGrouping(e.target.value ? [e.target.value] : [])}
          >
            <MenuItem value=""><em>Nenhum</em></MenuItem>
            {table.getAllLeafColumns()
              .filter(col => col.getCanGroup() && allowedGroupingColumns.includes(col.id))
              .map(col => (
                <MenuItem key={col.id} value={col.id}>
                  {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                </MenuItem>
            ))}
          </Select>
        </FormControl>
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

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {!loading && !error && (
        // *** FIX: Ensure TableContainer allows scroll, but Table itself doesn't force it ***
        <TableContainer component={Paper} sx={{ boxShadow: 1, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
          {/* Removed minWidth from Table */}
          <Table sx={{ tableLayout: 'auto' /* Allow browser to manage layout */ }} aria-label="estoque table">
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      sortDirection={header.column.getIsSorted()}
                      // *** FIX: Use column size from definition ***
                      sx={{ 
                        fontWeight: 'bold', 
                        whiteSpace: 'nowrap',
                        py: 1,
                        px: 1,
                        width: header.getSize(), // Apply defined size
                        minWidth: header.getSize(), // Ensure minimum width
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            // Prevent header content from causing overflow
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <Box 
                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                            sx={{ 
                              cursor: header.column.getCanSort() ? 'pointer' : 'default', 
                              display: 'flex', 
                              alignItems: 'center',
                              // Allow header text to shrink if needed
                              minWidth: 0, 
                            }}
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
                          {header.column.getCanFilter() && (
                            <IconButton
                              size="small"
                              onClick={(e) => handleFilterIconClick(e, header.column.id)}
                              color={header.column.getIsFiltered() ? 'primary' : 'default'}
                              aria-describedby={filterPopoverId}
                              sx={{ p: 0.25 }}
                            >
                              <FilterListIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
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
                      const context = cell.getContext();
                      return (
                        <TableCell 
                          key={cell.id}
                          sx={{ 
                            py: 0.75,
                            px: 1,
                            // Allow text wrap for most cells
                            whiteSpace: ['custo', 'preco_venda', 'quantidade_atual'].includes(cell.column.id) ? 'nowrap' : 'normal',
                            overflowWrap: 'break-word', // Ensure long words break
                            width: cell.column.getSize(), // Apply defined size
                            ...(cell.getIsGrouped() && { 
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }),
                            ...(cell.getIsAggregated() && { 
                              fontWeight: 'bold',
                              color: 'text.secondary',
                              whiteSpace: 'nowrap',
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

      {/* Filter Popover */}
      <Popover
        id={filterPopoverId}
        open={openFilterPopover}
        anchorEl={filterAnchorEl}
        onClose={handleFilterPopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {/* *** FIX: Add try-catch around filter rendering *** */}
        {(() => {
          try {
            return (
              <>
                <DateRangeColumnFilter 
                  column={currentFilterColumn} 
                  isActive={currentFilterColumn?.id === 'data_compra'} 
                />
                <Filter 
                  column={currentFilterColumn} 
                  isActive={currentFilterColumn?.id !== 'data_compra'} 
                />
              </>
            );
          } catch (popoverError) {
            console.error("Error rendering filter popover content:", popoverError);
            return <Alert severity="error" sx={{ p: 1 }}>Erro ao renderizar filtro.</Alert>;
          }
        })()}
      </Popover>

      <AddProductModal 
        open={openAddModal} 
        onClose={handleCloseAddModal} 
        onSuccess={handleProductAdded} 
      />

    </Container>
  );
};

export default EstoquePage;

