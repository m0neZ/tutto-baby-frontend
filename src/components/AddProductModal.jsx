import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
// Removed unused DialogActions and Button imports
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ProductForm from '../ProductForm'; // Import the existing form

// Accept initialData prop for editing
const AddProductModal = ({ open, onClose, onSuccess, initialData }) => {
  const isEditing = !!initialData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm" // Adjust size as needed
      fullWidth
    >
      {/* Dynamically set title based on editing or adding */}
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold', color: 'primary.main' }}>
        {isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Pass initialData and onSuccess to ProductForm */}
        <ProductForm
          onProductAdded={onSuccess} // Keep this prop name for now, form handles logic
          initialData={initialData}
        />
      </DialogContent>
      {/* Actions are handled within ProductForm */}
    </Dialog>
  );
};

export default AddProductModal;

