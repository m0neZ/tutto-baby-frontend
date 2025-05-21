import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ProductForm from '../ProductForm';

/**
 * Modal component for adding or editing products
 * 
 * @param {Object} props Component props
 * @param {boolean} props.open Whether modal is visible
 * @param {Function} props.onClose Callback to close the modal
 * @param {Function} props.onSuccess Callback after successful add/edit to refresh parent
 * @param {Object} props.productData Product data when editing, undefined when adding new
 * @param {boolean} props.isEditMode Whether we're in edit mode
 */
const AddProductModal = ({ open, onClose, onSuccess, productData, isEditMode }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          overflowY: 'auto'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {isEditMode ? 'Editar Produto' : 'Adicionar Produto'}
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
          initialData={productData}
          isEditMode={isEditMode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
