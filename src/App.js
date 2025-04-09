import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import AdminPage from './AdminPage';
import Header from './Header';

function App() {
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <Router>
      <Header onOpenForm={() => setShowForm(true)} />
      <div style={{ paddingTop: '100px', padding: '2rem', fontFamily: 'sans-serif' }}>
        {/* 👇 This is the row you couldn’t see */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h1>Estoque</h1>
          <button onClick={() => setShowForm(true)}>+ Produto</button>
        </div>

        <Routes>
          <Route path="/" element={<ProductList refreshFlag={refreshFlag} />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>

        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: 500,
              width: '100%',
              position: 'relative'
            }}>
              <button
                style={{ position: 'absolute', top: 10, right: 10 }}
                onClick={() => setShowForm(false)}
              >
                Fechar
              </button>
              <h2 style={{ marginBottom: '1rem' }}>Novo Produto</h2>
              <ProductForm
                onProductAdded={() => {
                  setRefreshFlag(!refreshFlag);
                  setShowForm(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
