import React, { useState } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';

function App() {
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Estoque</h1>
        <button onClick={() => setShowForm(true)}>+ Produto</button>
      </div>

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
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: 500, width: '100%' }}>
            <h2>Novo Produto</h2>
            <button style={{ float: 'right' }} onClick={() => setShowForm(false)}>Fechar</button>
            <ProductForm
              onProductAdded={() => {
                setRefreshFlag(!refreshFlag);
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}

      <ProductList refreshFlag={refreshFlag} />
    </div>
  );
}

export default App;
