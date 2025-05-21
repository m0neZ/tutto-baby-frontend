// src/pages/ClientesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import authFetch from '../api';
import { MaterialReactTable } from 'material-react-table';
import { Box, CircularProgress, Alert } from '@mui/material';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/clientes/', { method: 'GET' });
      const list = Array.isArray(res) ? res : (res.clientes || []);
      setClientes(list);
      setError(null);
    } catch (e) {
      setError(e.message);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const columns = useMemo(
    () => [
      { accessorKey: 'nome', header: 'Nome' },
      { accessorKey: 'sobrenome', header: 'Sobrenome' },
      { accessorKey: 'email', header: 'Email' },
      // add other client fields here
    ],
    []
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <MaterialReactTable
        columns={columns}
        data={clientes}
        localization={MRT_Localization_PT_BR}
      />
    </Box>
  );
}
