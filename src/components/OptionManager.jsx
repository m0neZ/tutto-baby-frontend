// src/components/OptionManager.jsx
import React, { useState, useEffect } from 'react';
import authFetch from '../api';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
} from '@mui/material';

export default function OptionManager({ fieldType }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    authFetch(`/opcoes_campo/${fieldType}?incluir_inativos=true`, { method: 'GET' })
      .then(data => {
        if (!isMounted) return;
        if (Array.isArray(data.opcoes)) {
          setOptions(data.opcoes);
        } else {
          console.warn('OptionManager: expected array, got', data.opcoes);
          setOptions([]);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [fieldType]);

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Box color="error.main">Erro: {error}</Box>;

  const handleSave = () => {
    // Implement save logic here
  };

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel>{fieldType}</InputLabel>
        <Select label={fieldType} defaultValue="">
          {options.map(opt => (
            <MenuItem key={opt.id} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleSave} sx={{ mt: 2 }}>
        Salvar Alterações
      </Button>
    </Box>
  );
}
