// src/pages/RelatoriosPage.jsx
import React, { useState, useEffect } from 'react';
import { authFetch } from '../api';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

export default function RelatoriosPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch('/summary', { method: 'GET' })
      .then(data => {
        setReport(data);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Relatórios
      </Typography>
      <pre>{JSON.stringify(report, null, 2)}</pre>
    </Box>
  );
}
