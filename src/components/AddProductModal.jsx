import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ProductForm from '../ProductForm'; // Import the existing form

const AddProductModal = ({ open, onClose, onSuccess }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" // Adjust size as needed
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold', color: 'primary.main' }}>
        Adicionar Novo Produto
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
        {/* Render the ProductForm inside the modal content */}
        {/* Pass the onSuccess callback to ProductForm so it can trigger refresh */}
        <ProductForm onProductAdded={onSuccess} />
      </DialogContent>
      {/* DialogActions can be added here if needed, e.g., for form submission buttons */}
      {/* However, ProductForm currently has its own submit button */}
      {/* We might move the button here later for better modal UX */}
    </Dialog>
  );
};

export default AddProductModal;

