// src/components/AddProductModal.jsx

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ProductForm from '../ProductForm'; // ← fixed import path

export default function AddProductModal({ open, onClose, onSuccess, productData }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {productData ? 'Editar Produto' : 'Adicionar Produto'}
      </DialogTitle>
      <DialogContent dividers>
        <ProductForm
          initialData={productData}
          onProductAdded={() => {
            onSuccess();
            onClose();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button form="product-form" type="submit" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
