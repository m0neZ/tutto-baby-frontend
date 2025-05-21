// src/AdminPage.jsx
import React from 'react';
import PatternCanvas from './components/PatternCanvas';
import OptionManager from './components/OptionManager';
import { Box, Typography } from '@mui/material';

export default function AdminPage() {
  return (
    <Box sx={{ position: 'relative', p: 4 }}>
      <PatternCanvas />
      <Typography variant="h4" gutterBottom>
        Administração de Campos
      </Typography>
      {['sexo', 'cor_estampa', 'tamanho'].map((type) => (
        <Box key={type} sx={{ my: 2 }}>
          <OptionManager fieldType={type} />
        </Box>
      ))}
    </Box>
  );
}
