// File: src/App.js
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './auth/AuthContext';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import EstoquePage from './pages/EstoquePage';
import VendasPage from './pages/VendasPage';
import ClientesPage from './pages/ClientesPage';
import RelatoriosPage from './pages/RelatoriosPage';
import AdminPage from './AdminPage';
import LoginPage from './pages/LoginPage';

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/estoque" replace />} />
            <Route
              path="/estoque"
              element={
                <PrivateRoute>
                  <EstoquePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendas"
              element={
                <PrivateRoute>
                  <VendasPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <PrivateRoute>
                  <ClientesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <PrivateRoute>
                  <RelatoriosPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}
