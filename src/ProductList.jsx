import React, { useEffect, useState } from 'react';
import { fetchProducts } from './api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  loadProducts();
}, [refreshFlag]); // <-- add refreshFlag here

  if (loading) return <p>Loading products...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>📦 Product List</h2>
      <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Gender</th>
            <th>Size</th>
            <th>Color/Print</th>
            <th>Quantity</th>
            <th>Cost</th>
            <th>Retail</th>
            <th>Supplier</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>{p.gender}</td>
              <td>{p.size}</td>
              <td>{p.color_print}</td>
              <td>{p.current_quantity}</td>
              <td>${p.cost_price.toFixed(2)}</td>
              <td>${p.retail_price.toFixed(2)}</td>
              <td>{p.supplier_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;
