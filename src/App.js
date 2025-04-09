import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import AdminPage from './AdminPage';
import Header from './Header';
import './styles/theme.css';

const MainContent = ({ refreshFlag, setRefreshFlag, setShowForm }) => {
  const location = useLocation();
  const isProductView = location.pathname === '/';

  return (
    <main>
      {isProductView && (
        <div className="page-header">
          <h1>Estoque</h1>
          <button className="button-primary" onClick={() => setShowForm(true)}>
            + Produto
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<ProductList refreshFlag={refreshFlag} />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </main>
  );
};

function App() {
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <Router>
      <Header onOpenForm={() => setShowForm(true)} />
      <MainContent
        refreshFlag={refreshFlag}
        setRefreshFlag={setRefreshFlag}
        setShowForm={setShowForm}
      />
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowForm(false)}>
              ✕
            </button>
            <h2>Novo Produto</h2>
            <ProductForm
              onProductAdded={() => {
                setRefreshFlag(!refreshFlag);
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
