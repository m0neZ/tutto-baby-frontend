// File: src/App.js

import React, { useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthContext } from "./auth/AuthContext";
import { Box } from "@mui/material";

import Sidebar from "./components/Sidebar";
import EstoquePage from "./pages/EstoquePage";
import VendasPage from "./pages/VendasPage";
import ClientesPage from "./pages/ClientesPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import AdminPage from "./AdminPage";
import LoginPage from "./pages/LoginPage";

function PrivateLayout() {
  const { token } = useContext(AuthContext);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateLayout />}>
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/vendas" element={<VendasPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/" element={<Navigate to="/estoque" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
