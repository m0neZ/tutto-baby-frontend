import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

const RelatoriosPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 3 }}>
        Relatórios
      </Typography>
      <Paper sx={{ p: 3, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ color: 'text.secondary' }}>
          Funcionalidade de geração e visualização de relatórios (vendas, estoque, COGS) será implementada aqui.
        </Typography>
        {/* Placeholder content or components for reports can be added here later */}
        <Box sx={{ mt: 2, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            (Área para gráficos/tabelas de relatórios)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RelatoriosPage;

