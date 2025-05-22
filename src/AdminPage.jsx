import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import OptionManager from './components/OptionManager';

const AdminPage = () => {
  const tabsConfig = [
    { key: 'tamanho', label: 'Tamanhos' },
    { key: 'cor_estampa', label: 'Cores / Estampas' },
    { key: 'fornecedor', label: 'Fornecedores' },
  ];

  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 3 }}>
        Gerenciar Opções
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleChange} 
          aria-label="Opções de gerenciamento" 
          indicatorColor="primary"
          textColor="primary"
        >
          {tabsConfig.map((tab) => (
            <Tab 
              key={tab.key} 
              label={tab.label} 
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          ))}
        </Tabs>
      </Box>

      <Paper sx={{ p: 3, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
        <OptionManager type={tabsConfig[activeTab].key} />
      </Paper>
    </Container>
  );
};

export default AdminPage;
