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
    reorderThreshold: '5'
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
        reorder_threshold: parseInt(formData.reorderThreshold),
      };

      const response = await createProduct(payload);

      if (response.success) {
        setFormSuccess('✅ Product added!');
        setFormData({
          name: '',
          gender: '',
          size: '',
          colorPrint: '',
          supplierId: '',
          cost: '',
          retailPrice: '',
          quantity: '',
          reorderThreshold: '5'
        });
        if (onProductAdded) onProductAdded(); // trigger refresh in parent
      } else {
        setFormError(response.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Something went wrong while submitting.');
    }
  };

  const matchingNames = formData.name
    ? products
        .map(p => p.name)
        .filter(n => n.toLowerCase().includes(formData.name.toLowerCase()))
    : [];

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: 400 }}>
        <input
          name="name"
          placeholder="Product Name"
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
          <option value="">Select Gender</option>
          <option value="male">Boy</option>
          <option value="female">Girl</option>
        </select>

        <input name="size" placeholder="Size (e.g., 0-3m)" value={formData.size} onChange={handleChange} required />
        <input name="colorPrint" placeholder="Color / Print" value={formData.colorPrint} onChange={handleChange} required />

        <select name="supplierId" value={formData.supplierId} onChange={handleChange} required>
          <option value="">Select Supplier</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input type="number" name="cost" placeholder="Cost Price" value={formData.cost} onChange={handleChange} required />
        <input type="number" name="retailPrice" placeholder="Retail Price" value={formData.retailPrice} onChange={handleChange} required />
        <input type="number" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} required />
        <input type="number" name="reorderThreshold" placeholder="Reorder Threshold" value={formData.reorderThreshold} onChange={handleChange} />

        <button type="submit">Add Product</button>
      </form>

      {formSuccess && <p style={{ color: 'green' }}>{formSuccess}</p>}
      {formError && <p style={{ color: 'red' }}>{formError}</p>}
    </div>
  );
};

export default ProductForm;
