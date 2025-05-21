// src/pages/VendasPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import authFetch from '../api';
import { MaterialReactTable } from 'material-react-table';
import { Box, CircularProgress, Alert } from '@mui/material';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';

export default function VendasPage() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/vendas/', { method: 'GET' });
      const list = Array.isArray(res) ? res : (res.vendas || []);
      setVendas(list);
      setError(null);
    } catch (e) {
      setError(e.message);
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  const columns = useMemo(
    () => [
      { accessorKey: 'cliente_nome', header: 'Cliente' },
      { accessorKey: 'produto', header: 'Produto' },
      { accessorKey: 'preco_venda', header: 'Preço (R$)' },
      { accessorKey: 'desconto_pct', header: 'Desconto (%)' },
      { accessorKey: 'data_venda', header: 'Data Venda' },
      { accessorKey: 'data_pagto', header: 'Data Pgto' },
      { accessorKey: 'status', header: 'Status' },
      // add other sales fields here
    ],
    []
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <MaterialReactTable
        columns={columns}
        data={vendas}
        localization={MRT_Localization_PT_BR}
      />
    </Box>
  );
}
