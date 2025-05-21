// src/App.js

import React, { useContext } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { AuthContext } from './auth/AuthContext';
import Layout from './components/Layout';
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
  const { token } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        {/* If already logged in, /login immediately bounces to /estoque */}
        <Route
          path="/login"
          element={token ? <Navigate to="/estoque" replace /> : <LoginPage />}
        />

        {/* Root always → /estoque */}
        <Route path="/" element={<Navigate to="/estoque" replace />} />

        {/* Protected routes under Layout */}
        <Route
          path="/estoque"
          element={
            <PrivateRoute>
              <Layout>
                <EstoquePage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/vendas"
          element={
            <PrivateRoute>
              <Layout>
                <VendasPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <PrivateRoute>
              <Layout>
                <ClientesPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <PrivateRoute>
              <Layout>
                <RelatoriosPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Anything else → if logged in go back to /estoque, otherwise /login */}
        <Route
          path="*"
          element={
            token
              ? <Navigate to="/estoque" replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
