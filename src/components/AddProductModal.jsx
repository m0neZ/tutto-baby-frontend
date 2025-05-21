// src/AddProductModal.jsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ProductForm from './ProductForm';

export default function AddProductModal({
  open,
  onClose,
  onSuccess,
  productData,
  isEditMode,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
      <DialogContent>
        <ProductForm
          initialData={productData}
          onSubmit={async (formData) => {
            try {
              const url = isEditMode
                ? `/api/produtos/${formData.id}`
                : '/api/produtos/';
              const method = isEditMode ? 'PUT' : 'POST';
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
              });
              if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Erro na requisição');
              }
              onSuccess();
            } catch (e) {
              console.error(e);
              alert(`Falha ao ${isEditMode ? 'editar' : 'adicionar'} produto: ${e.message}`);
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
