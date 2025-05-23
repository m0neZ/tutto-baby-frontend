// src/components/SaleForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Divider,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { authFetch } from '../api';
import ProductSelectionModal from './ProductSelectionModal';

const SaleForm = ({ open, onClose, onSave, editData = null }) => {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    forma_pagamento: '',
    data_venda: dayjs(),
    produtos: []
  });
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch payment methods on component mount
  useEffect(() => {
    const fetchFormasPagamento = async () => {
      try {
        const response = await authFetch('/opcoes_campo/forma_pagamento');
        if (response && response.success && Array.isArray(response.opcoes)) {
          setFormasPagamento(response.opcoes);
        } else {
          // Fallback default payment methods if API fails
          setFormasPagamento([
            { id: 1, value: 'Dinheiro' },
            { id: 2, value: 'Cartão de Crédito' },
            { id: 3, value: 'Cartão de Débito' },
            { id: 4, value: 'PIX' },
            { id: 5, value: 'Transferência Bancária' }
          ]);
        }
      } catch (error) {
        console.error('Erro ao buscar formas de pagamento:', error);
        // Fallback default payment methods if API fails
        setFormasPagamento([
          { id: 1, value: 'Dinheiro' },
          { id: 2, value: 'Cartão de Crédito' },
          { id: 3, value: 'Cartão de Débito' },
          { id: 4, value: 'PIX' },
          { id: 5, value: 'Transferência Bancária' }
        ]);
      }
    };

    fetchFormasPagamento();
  }, []);

  // Set form data if editing
  useEffect(() => {
    if (editData) {
      setFormData({
        nome: editData.nome || '',
        sobrenome: editData.sobrenome || '',
        forma_pagamento: editData.forma_pagamento || '',
        data_venda: editData.data_venda ? dayjs(editData.data_venda) : dayjs(),
        produtos: editData.produtos || []
      });
    } else {
      // Reset form for new sale
      setFormData({
        nome: '',
        sobrenome: '',
        forma_pagamento: '',
        data_venda: dayjs(),
        produtos: []
      });
    }
  }, [editData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      data_venda: date
    }));
    
    if (errors.data_venda) {
      setErrors(prev => ({
        ...prev,
        data_venda: null
      }));
    }
  };

  const handleAddProduct = () => {
    setIsProductModalOpen(true);
  };

  const handleProductSelected = (selectedProducts) => {
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, ...selectedProducts]
    }));
    setIsProductModalOpen(false);
  };

  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.sobrenome.trim()) {
      newErrors.sobrenome = 'Sobrenome é obrigatório';
    }
    
    if (!formData.forma_pagamento) {
      newErrors.forma_pagamento = 'Forma de pagamento é obrigatória';
    }
    
    if (!formData.data_venda) {
      newErrors.data_venda = 'Data da venda é obrigatória';
    }
    
    if (formData.produtos.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format data for API
      const saleData = {
        cliente_nome: formData.nome,
        cliente_sobrenome: formData.sobrenome,
        forma_pagamento: formData.forma_pagamento,
        data_venda: formData.data_venda.format('YYYY-MM-DD'),
        produtos: formData.produtos.map(p => ({
          produto_id: p.id,
          quantidade: 1, // Always 1 in single-unit paradigm
          preco_venda: p.preco_venda
        })),
        status: 'Pagamento Pendente'
      };
      
      await onSave(saleData, editData?.id);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.produtos.reduce((sum, product) => sum + parseFloat(product.preco_venda || 0), 0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle>
        {editData ? 'Editar Venda' : 'Nova Venda'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Cliente Information */}
          <Grid item xs={12} sx={{ borderBottom: '1px solid #eee', pb: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações do Cliente
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="nome"
              label="Nome"
              value={formData.nome}
              onChange={handleChange}
              fullWidth
              error={!!errors.nome}
              helperText={errors.nome}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="sobrenome"
              label="Sobrenome"
              value={formData.sobrenome}
              onChange={handleChange}
              fullWidth
              error={!!errors.sobrenome}
              helperText={errors.sobrenome}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.forma_pagamento} required>
              <InputLabel>Forma de Pagamento</InputLabel>
              <Select
                name="forma_pagamento"
                value={formData.forma_pagamento}
                onChange={handleChange}
                label="Forma de Pagamento"
              >
                {formasPagamento.map((option) => (
                  <MenuItem key={option.id} value={option.value}>
                    {option.value}
                  </MenuItem>
                ))}
              </Select>
              {errors.forma_pagamento && (
                <Typography variant="caption" color="error">
                  {errors.forma_pagamento}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                label="Data da Venda"
                value={formData.data_venda}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.data_venda,
                    helperText: errors.data_venda
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Products Section */}
          <Grid item xs={12} sx={{ borderBottom: '1px solid #eee', pt: 2, pb: 2, mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Produtos
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                color="primary"
              >
                Adicionar Produto
              </Button>
            </Box>
            
            {errors.produtos && (
              <Typography variant="caption" color="error" paragraph>
                {errors.produtos}
              </Typography>
            )}
            
            {formData.produtos.length > 0 ? (
              <Paper variant="outlined" sx={{ maxHeight: '300px', overflow: 'auto' }}>
                <List dense>
                  {formData.produtos.map((product, index) => (
                    <ListItem key={index} divider={index < formData.produtos.length - 1}>
                      <ListItemText
                        primary={product.nome}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {`${product.tamanho} | ${product.cor_estampa}`}
                            </Typography>
                            <br />
                            {`R$ ${parseFloat(product.preco_venda).toFixed(2).replace('.', ',')}`}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveProduct(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                Nenhum produto adicionado
              </Typography>
            )}
            
            {formData.produtos.length > 0 && (
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Typography variant="subtitle1">
                  Total: R$ {calculateTotal().toFixed(2).replace('.', ',')}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : (editData ? 'Salvar' : 'Adicionar Venda')}
        </Button>
      </DialogActions>
      
      <ProductSelectionModal
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductsSelected={handleProductSelected}
      />
    </Dialog>
  );
};

export default SaleForm;
