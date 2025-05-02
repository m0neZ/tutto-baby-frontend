import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import EstoquePage from './pages/EstoquePage'; // Placeholder
import VendasPage from './pages/VendasPage'; // Placeholder
import RelatoriosPage from './pages/RelatoriosPage'; // Placeholder
import ClientesPage from './pages/ClientesPage'; // Placeholder
import AdminPage from './AdminPage'; // Placeholder for the redesigned Admin page

// Placeholder components for pages
// const EstoquePage = () => <div className="text-xl font-semibold">Página de Estoque</div>;
// const VendasPage = () => <div className="text-xl font-semibold">Página de Vendas</div>;
// const RelatoriosPage = () => <div className="text-xl font-semibold">Página de Relatórios</div>;
// const ClientesPage = () => <div className="text-xl font-semibold">Página de Clientes</div>;
// const AdminPage = () => <div className="text-xl font-semibold">Página de Admin</div>;

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<EstoquePage />} /> {/* Default to Estoque */}
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/vendas" element={<VendasPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Add other routes as needed */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

