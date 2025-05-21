// src/components/Layout.jsx

import React from 'react';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: 'background.default'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
