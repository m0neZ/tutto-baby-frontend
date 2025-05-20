// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';        // <-- new import
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);                    // <-- create a root

root.render(
  <AuthProvider>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </AuthProvider>
);
