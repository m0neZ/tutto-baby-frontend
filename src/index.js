// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';           // your existing theme.js
import './index.css';                  // your existing global styles

ReactDOM.render(
  <AuthProvider>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </AuthProvider>,
  document.getElementById('root')
);
