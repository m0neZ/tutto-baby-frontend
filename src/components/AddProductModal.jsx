import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ProductForm from '../ProductForm'; // points at src/ProductForm.jsx

// Props:
//   open        (bool) — whether modal is visible
//   onClose     (fn)   — callback to close it
//   onSuccess   (fn)   — to refresh parent after add/edit
//   initialData (obj)  — when editing, else undefined
const AddProductModal = ({ open, onClose, onSuccess, initialData }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {initialData ? 'Editar Produto' : 'Adicionar Produto'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <ProductForm
          onProductAdded={onSuccess}
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
