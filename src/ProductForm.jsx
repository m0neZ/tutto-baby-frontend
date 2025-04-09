import React, { useEffect, useState } from 'react';
import { createProduct, fetchSuppliers, fetchProducts } from './api';

const ProductForm = ({ onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    size: '',
    colorPrint: '',
    supplierId: '',
    cost: '',
    retailPrice: '',
    quantity: '',
    purchaseDate: '',
    saleDate: ''
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productList, supplierList] = await Promise.all([
          fetchProducts(),
          fetchSuppliers()
        ]);
        setProducts(productList);
        setSuppliers(supplierList);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        name: formData.name,
        gender: formData.gender,
        size: formData.size,
        color_print: formData.colorPrint,
        supplier_id: parseInt(formData.supplierId),
        cost_price: parseFloat(formData.cost),
        retail_price: parseFloat(formData.retailPrice),
        current_quantity: parseInt(formData.quantity),
        purchase_date: formData.purchaseDate || null,
        sale_date: formData.saleDate || null
      };

      const response = await createProduct(payload);

      if (response.success) {
        setFormSuccess('✅ Produto adicionado!');
        setFormData({
          name: '',
          gender: '',
          size: '',
          colorPrint: '',
          supplierId: '',
          cost: '',
          retailPrice: '',
          quantity: '',
          purchaseDate: '',
          saleDate: ''
        });
        if (onProductAdded) onProductAdded(); // trigger refresh in parent
      } else {
        setFormError(response.error || 'Algo deu errado.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Erro ao enviar o formulário.');
    }
  };

  const matchingNames = formData.name
    ? products
        .map(p => p.name)
        .filter(n => n.toLowerCase().includes(formData.name.toLowerCase()))
    : [];

  return (
    <div style={{ marginBottom: '3rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: 400 }}>
        <input
          name="name"
          placeholder="Nome do Produto"
          value={formData.name}
          onChange={handleChange}
          list="name-suggestions"
          required
        />
        <datalist id="name-suggestions">
          {matchingNames.map((name, idx) => (
            <option key={idx} value={name} />
          ))}
        </datalist>

        <select name="gender" value={formData.gender} onChange={handleChange} required>
          <option value="">Selecione o Sexo</option>
          <option value="male">Masculino</option>
          <option value="female">Feminino</option>
        </select>

        <input name="size" placeholder="Tamanho" value={formData.size} onChange={handleChange} required />
        <input name="colorPrint" placeholder="Cor / Estampa" value={formData.colorPrint} onChange={handleChange} required />

        <select name="supplierId" value={formData.supplierId} onChange={handleChange} required>
          <option value="">Selecione o Fornecedor</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input type="number" name="cost" placeholder="Custo (R$)" value={formData.cost} onChange={handleChange} required />
        <input type="number" name="retailPrice" placeholder="Preço de Venda (R$)" value={formData.retailPrice} onChange={handleChange} required />
        <input type="number" name="quantity" placeholder="Quantidade" value={formData.quantity} onChange={handleChange} required />

        <label>
          Data da Compra:
          <input
            type="date"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
        </label>

        <label>
          Data da Venda:
          <input
            type="date"
            name="saleDate"
            value={formData.saleDate}
            onChange={handleChange}
          />
        </label>

        <button type="submit">Adicionar</button>
      </form>

      {formSuccess && <p style={{ color: 'green' }}>{formSuccess}</p>}
      {formError && <p style={{ color: 'red' }}>{formError}</p>}
    </div>
  );
};

export default ProductForm;
