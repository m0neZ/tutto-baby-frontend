import React, { useState } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';

function App() {
  const [refreshFlag, setRefreshFlag] = useState(false);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Pima Inventory Frontend</h1>
      <ProductForm onProductAdded={() => setRefreshFlag(!refreshFlag)} />
      <ProductList refreshFlag={refreshFlag} />
    </div>
  );
}

export default App;
