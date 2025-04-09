import React, { useEffect, useState } from 'react';
import { fetchProducts } from './api';

const ProductList = ({ refreshFlag }) => {
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
      <th>Nome</th>
      <th>Sexo</th>
      <th>Cor/Estampa</th>
      <th>Tamanho</th>
      <th>Quantidade</th>
      <th>Custo</th>
      <th>Preço de Venda</th>
      <th>Fornecedor</th>
      <th>Data da Compra</th>
      <th>Data da Venda</th>
    </tr>
  </thead>
  
<tbody>
  {products.map((p) => (
    <tr key={p.id}>
      <td>{p.name}</td>
      <td>{p.gender === 'male' ? 'Masculino' : 'Feminino'}</td>
      <td>{p.color_print}</td>
      <td>{p.size}</td>
      <td>{p.current_quantity}</td>
      <td>{p.cost_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      <td>{p.retail_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      <td>{p.supplier_name}</td>
      <td>{p.purchase_date ? new Date(p.purchase_date).toLocaleDateString('pt-BR') : '-'}</td>
      <td>{p.sale_date ? new Date(p.sale_date).toLocaleDateString('pt-BR') : '-'}</td>
    </tr>
  ))}
</tbody>
      </table>
    </div>
  );
};

export default ProductList;
